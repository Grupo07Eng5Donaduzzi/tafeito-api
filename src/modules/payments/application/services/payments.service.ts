import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { CreatePixPaymentDto } from '../dto/create-pix-payment.dto';
import { PixPaymentDto } from '../dto/pix-payment.dto';
import { PaymentStatusDto } from '../dto/payment-status.dto';
import { TransferPixDto } from '../dto/transfer-pix.dto';

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';

interface AsaasListResponse<T> {
    data: T[];
}

interface AsaasCustomer {
    id: string;
}

interface AsaasPaymentResponse {
    id: string;
    status: string;
    value: number;
    invoiceUrl?: string;
}

interface AsaasPixQrCodeResponse {
    encodedImage?: string;
    payload?: string;
    qrCode?: string;
    qrCodeBase64?: string;
}

interface AsaasPaymentStatusResponse {
    status: string;
}

interface AsaasTransferResponse {
    id: string;
    status: string;
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    private readonly baseUrl = process.env.ASAAS_BASE_URL ?? 'https://api-sandbox.asaas.com/v3';
    private readonly userAgent = process.env.ASAAS_USER_AGENT ?? 'tafeito-api/1.0';

    private readonly maxRetries = 3;
    private readonly retryDelayMs = 300;

    async createPix(dto: CreatePixPaymentDto): Promise<PixPaymentDto> {
        const amount = this.parsePositiveNumber(dto.amount, 'amount');
        const payerEmail = this.validateEmail(dto.payerEmail, 'payerEmail');
        const payerFirstName = dto.payerFirstName
            ? this.validateNonEmptyString(dto.payerFirstName, 'payerFirstName')
            : undefined;
        const payerLastName = dto.payerLastName
            ? this.validateNonEmptyString(dto.payerLastName, 'payerLastName')
            : undefined;
        const payerDocumentType = this.validateDocumentType(dto.payerDocumentType);
        const payerDocumentNumber = this.validateDocumentNumber(
            dto.payerDocumentNumber,
            payerDocumentType,
        );

        const customerName = this.buildCustomerName(
            payerFirstName,
            payerLastName,
            payerEmail,
        );

        const customer = await this.getOrCreateCustomerSafe({
            name: customerName,
            cpfCnpj: payerDocumentNumber,
            email: payerEmail,
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const payment = await this.callAsaas<AsaasPaymentResponse>(
            'POST',
            '/payments',
            {
                customer: customer.id,
                billingType: 'PIX',
                value: amount,
                dueDate: this.formatLocalDate(tomorrow),
            },
        );

        const qrCode = await this.callAsaas<AsaasPixQrCodeResponse>(
            'GET',
            `/payments/${payment.id}/pixQrCode`,
        );

        const qrCodePayload = qrCode.payload ?? qrCode.qrCode ?? '';
        const qrCodeBase64 = qrCode.encodedImage ?? qrCode.qrCodeBase64 ?? '';

        if (!qrCodePayload || !qrCodeBase64) {
            throw new BadRequestException('Falha ao gerar QR Code PIX');
        }

        return {
            id: payment.id,
            status: payment.status,
            amount: payment.value ?? amount,
            payerEmail,
            qrCode: qrCodePayload,
            qrCodeBase64,
            ticketUrl: payment.invoiceUrl,
        };
    }

    async getStatus(paymentId: string): Promise<PaymentStatusDto> {
        const id = this.validateNonEmptyString(paymentId, 'paymentId');

        const response = await this.callAsaas<AsaasPaymentStatusResponse>(
            'GET',
            `/payments/${id}/status`,
        );

        return {
            id,
            status: response.status,
            paid: this.isPaidStatus(response.status),
        };
    }

    async transferToPix(
        amount: number,
        pixKey: string,
        externalReference?: string,
    ): Promise<TransferPixDto> {
        const value = this.parsePositiveNumber(amount, 'amount');
        const trimmedPixKey = this.validateNonEmptyString(pixKey, 'pixKey');
        const pixKeyType = this.inferPixKeyType(trimmedPixKey);
        const normalizedPixKey = this.normalizePixKey(trimmedPixKey, pixKeyType);

        const response = await this.callAsaas<AsaasTransferResponse>(
            'POST',
            '/transfers',
            {
                value,
                pixAddressKey: normalizedPixKey,
                pixAddressKeyType: pixKeyType,
                operationType: 'PIX',
                description: 'Transferencia Tafeito',
                externalReference,
            },
        );

        return {
            id: response.id,
            status: response.status,
        };
    }

    private buildCustomerName(
        firstName?: string,
        lastName?: string,
        fallbackEmail?: string,
    ): string {
        const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
        if (combined) return combined;
        if (fallbackEmail) return fallbackEmail;
        return 'Cliente Tafeito';
    }

    private async getOrCreateCustomerSafe(params: {
        name: string;
        email: string;
        cpfCnpj: string;
    }): Promise<AsaasCustomer> {
        const existing = await this.findCustomerByCpfCnpj(params.cpfCnpj);
        if (existing) return existing;

        try {
            return await this.callAsaas<AsaasCustomer>('POST', '/customers', {
                name: params.name,
                email: params.email,
                cpfCnpj: params.cpfCnpj,
            });
        } catch (err: any) {
            if (err?.status === 409 || err?.getStatus?.() === 409) {
                const retry = await this.findCustomerByCpfCnpj(params.cpfCnpj);
                if (retry) return retry;
            }
            throw err;
        }
    }

    private async findCustomerByCpfCnpj(
        cpfCnpj: string,
    ): Promise<AsaasCustomer | null> {
        const query = new URLSearchParams({ cpfCnpj, limit: '1' });
        const response = await this.callAsaas<AsaasListResponse<AsaasCustomer>>(
            'GET',
            `/customers?${query.toString()}`,
        );
        return response.data?.[0] ?? null;
    }

    private isPaidStatus(status: string): boolean {
        const paidStatuses = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
        return paidStatuses.has(status);
    }

    private formatLocalDate(date: Date): string {
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60_000);
        return local.toISOString().slice(0, 10);
    }

    private normalizePixKey(pixKey: string, type: PixKeyType): string {
        const trimmed = pixKey.trim();
        if (type === 'CPF' || type === 'CNPJ') {
            return trimmed.replace(/\D/g, '');
        }
        if (type === 'PHONE') {
            return trimmed.replace(/[^\d+]/g, '');
        }
        return trimmed;
    }

    private inferPixKeyType(pixKey: string): PixKeyType {
        const trimmed = pixKey.trim();

        if (trimmed.includes('@')) return 'EMAIL';

        if (trimmed.startsWith('+')) {
            const digits = trimmed.replace(/\D/g, '');
            if (digits.length >= 10 && digits.length <= 13) return 'PHONE';
        }

        const digitsOnly = trimmed.replace(/\D/g, '');

        if (digitsOnly.length === 11) return 'CPF';
        if (digitsOnly.length === 14) return 'CNPJ';

        if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) return 'EVP';

        return 'EVP';
    }

    private validateNonEmptyString(value: string, fieldName: string): string {
        if (typeof value !== 'string') {
            throw new BadRequestException(`${fieldName} deve ser string`);
        }
        const trimmed = value.trim();
        if (!trimmed) {
            throw new BadRequestException(`${fieldName} não pode estar vazio`);
        }
        return trimmed;
    }

    private validateEmail(value: string, fieldName: string): string {
        const trimmed = this.validateNonEmptyString(value, fieldName);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            throw new BadRequestException(`${fieldName} deve ser um email válido`);
        }
        return trimmed;
    }

    private validateDocumentType(value: string): 'CPF' | 'CNPJ' {
        const trimmed = this.validateNonEmptyString(value, 'payerDocumentType');
        const normalized = trimmed.toUpperCase();
        if (normalized !== 'CPF' && normalized !== 'CNPJ') {
            throw new BadRequestException('payerDocumentType deve ser CPF ou CNPJ');
        }
        return normalized as 'CPF' | 'CNPJ';
    }

    private validateDocumentNumber(value: string, type: 'CPF' | 'CNPJ'): string {
        const trimmed = this.validateNonEmptyString(value, 'payerDocumentNumber');
        const digitsOnly = trimmed.replace(/\D/g, '');
        const expectedLength = type === 'CPF' ? 11 : 14;

        if (digitsOnly.length !== expectedLength) {
            throw new BadRequestException(
                `payerDocumentNumber deve ter ${expectedLength} digitos`,
            );
        }

        if (type === 'CPF' && !this.isValidCpf(digitsOnly)) {
            throw new BadRequestException('payerDocumentNumber CPF inválido');
        }
        if (type === 'CNPJ' && !this.isValidCnpj(digitsOnly)) {
            throw new BadRequestException('payerDocumentNumber CNPJ inválido');
        }

        return digitsOnly;
    }

    private parsePositiveNumber(value: number | string, fieldName: string): number {
        const parsed =
            typeof value === 'number' ? value : Number(String(value).trim());
        if (Number.isNaN(parsed) || parsed <= 0) {
            throw new BadRequestException(`${fieldName} deve ser um número positivo`);
        }
        return parsed;
    }

    private isValidCpf(digits: string): boolean {
        if (/^(\d)\1{10}$/.test(digits)) return false;

        const calc = (factor: number) => {
            let sum = 0;
            for (let i = 0; i < factor - 1; i++) {
                sum += parseInt(digits[i]) * (factor - i);
            }
            const remainder = (sum * 10) % 11;
            return remainder === 10 || remainder === 11 ? 0 : remainder;
        };

        return (
            calc(10) === parseInt(digits[9]) &&
            calc(11) === parseInt(digits[10])
        );
    }

    private isValidCnpj(digits: string): boolean {
        if (/^(\d)\1{13}$/.test(digits)) return false;

        const calc = (length: number) => {
            let sum = 0;
            let pos = length - 7;
            for (let i = length; i >= 1; i--) {
                sum += parseInt(digits[length - i]) * pos--;
                if (pos < 2) pos = 9;
            }
            const remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        };

        return (
            calc(12) === parseInt(digits[12]) &&
            calc(13) === parseInt(digits[13])
        );
    }

    private getAccessToken(): string {
        const token = process.env.ASAAS_ACCESS_TOKEN;
        if (!token) {
            this.logger.error('ASAAS_ACCESS_TOKEN não configurado');
            throw new InternalServerErrorException(
                'Erro de configuração interna do servidor de pagamentos',
            );
        }
        return token;
    }

    private async callAsaas<T>(
        method: 'GET' | 'POST',
        path: string,
        body?: unknown,
    ): Promise<T> {
        let lastError: unknown;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.doRequest<T>(method, path, body);
            } catch (err: any) {
                const status = err?.getStatus?.() ?? err?.status;
                if (status && status >= 400 && status < 500) throw err;

                lastError = err;
                this.logger.warn(
                    `Tentativa ${attempt}/${this.maxRetries} falhou para ${method} ${path}: ${err?.message}`,
                );

                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelayMs * attempt);
                }
            }
        }

        throw lastError;
    }

    private async doRequest<T>(
        method: 'GET' | 'POST',
        path: string,
        body?: unknown,
    ): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                access_token: this.getAccessToken(),
                'Content-Type': 'application/json',
                'User-Agent': this.userAgent,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const text = await response.text();
        let data: any = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
        }

        if (!response.ok) {
            const message =
                data?.errors?.[0]?.description ??
                data?.message ??
                data?.error ??
                'Erro ao comunicar com Asaas';
            throw new HttpException(message, response.status);
        }

        return data as T;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
import { BadRequestException, HttpException, Injectable, InternalServerErrorException,} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreatePixPaymentDto } from '../dto/create-pix-payment.dto';
import { PixPaymentDto } from '../dto/pix-payment.dto';
import { PaymentStatusDto } from '../dto/payment-status.dto';
import { AuditService } from '../../audit/application/services/audit.service';

interface MercadoPagoPaymentResponse {
    id: number;
    status: string;
    status_detail?: string;
    transaction_amount: number;
    payer?: {
        email?: string;
    };
    point_of_interaction?: {
        transaction_data?: {
            qr_code?: string;
            qr_code_base64?: string;
            ticket_url?: string;
        };
    };
}

@Injectable()
export class PaymentsService {
    private readonly baseUrl = 'https://api.mercadopago.com';

    constructor(private readonly auditService: AuditService) {}

    async createPix(userId: string, dto: CreatePixPaymentDto): Promise<PixPaymentDto> {
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

        const payload = {
            transaction_amount: amount,
            payment_method_id: 'pix',
            payer: {
                email: payerEmail,
                first_name: payerFirstName,
                last_name: payerLastName,
                identification: {
                    type: payerDocumentType,
                    number: payerDocumentNumber,
                },
            },
        };

        const response = await this.callMercadoPago<MercadoPagoPaymentResponse>(
            'POST',
            '/v1/payments',
            payload,
        );

        const qrCode = response.point_of_interaction?.transaction_data?.qr_code ?? '';
        const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64 ?? '';

        if (!qrCode || !qrCodeBase64) {
            throw new BadRequestException('Falha ao gerar QR Code PIX');
        }

        await this.auditService.log(
            'PAYMENT_INITIATED',
            response.id.toString(),
            userId,
            { amount: response.transaction_amount, payerEmail: response.payer?.email ?? payerEmail }
        );

        return {
            id: response.id,
            status: response.status,
            amount: response.transaction_amount,
            payerEmail: response.payer?.email ?? payerEmail,
            qrCode,
            qrCodeBase64,
            ticketUrl: response.point_of_interaction?.transaction_data?.ticket_url,
        };
    }

    async getStatus(userId: string, paymentId: string): Promise<PaymentStatusDto> {
        const id = this.parsePaymentId(paymentId);
        const response = await this.callMercadoPago<MercadoPagoPaymentResponse>(
            'GET',
            `/v1/payments/${id}`,
        );

        if (response.status === 'approved') {
            const alreadyLogged = await this.auditService.hasAlreadyLogged('PAYMENT_APPROVED', response.id.toString());
            if (!alreadyLogged) {
                await this.auditService.log(
                    'PAYMENT_APPROVED',
                    response.id.toString(),
                    userId,
                    { amount: response.transaction_amount }
                );
            }
        }

        return {
            id: response.id,
            status: response.status,
            statusDetail: response.status_detail,
            paid: response.status === 'approved',
        };
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

        return digitsOnly;
    }

    private parsePositiveNumber(value: number | string, fieldName: string): number {
        const parsed = typeof value === 'number' ? value : Number(String(value).trim());

        if (Number.isNaN(parsed) || parsed <= 0) {
            throw new BadRequestException(`${fieldName} deve ser um número positivo`);
        }

        return parsed;
    }

    private parsePaymentId(value: string): number {
        const parsed = Number(String(value).trim());
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new BadRequestException('paymentId inválido');
        }
        return parsed;
    }

    private getAccessToken(): string {
        const token = process.env.MP_ACCESS_TOKEN;
        if (!token) {
            throw new InternalServerErrorException(
                'MP_ACCESS_TOKEN não configurado',
            );
        }
        return token;
    }

    private async callMercadoPago<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.getAccessToken()}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': randomUUID(),
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
                data?.message ??
                data?.error ??
                data?.cause?.[0]?.description ??
                'Erro ao comunicar com Mercado Pago';
            throw new HttpException(message, response.status);
        }

        return data as T;
    }
}

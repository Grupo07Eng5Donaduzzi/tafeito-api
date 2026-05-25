import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { fromBuffer } from 'file-type';
import {
  ALLOWED_MIME_TYPES,
  Invoice,
} from '../../domain/models/invoice.entity';
import type { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { INVOICE_REPOSITORY } from '../../domain/repositories/invoice-repository.interface';
import { InvoiceDto } from '../dto/invoice.dto';

const XML_TEXT_MIMES = new Set(['application/xml', 'text/xml']);

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly repository: InvoiceRepository,
  ) {}

  async upload(params: {
    paymentId: string;
    file: Express.Multer.File;
    uploadedByUserId: string;
  }): Promise<InvoiceDto> {
    const { paymentId, file, uploadedByUserId } = params;

    if (!file?.buffer || !file.mimetype) {
      throw new BadRequestException('Arquivo não enviado');
    }

    await this.assertContentMatchesMime(file);

    const invoice = Invoice.create({
      paymentId,
      fileContent: file.buffer,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: uploadedByUserId,
    });

    const persistedCreatedAt = await this.repository.create(invoice);

    return this.toDto(invoice, persistedCreatedAt);
  }

  async listByPayment(
    paymentId: string,
    requestingUserId: string,
  ): Promise<InvoiceDto[]> {
    const invoices = await this.repository.findByPaymentId(paymentId);
    return invoices
      .filter((inv) => inv.uploadedBy === requestingUserId)
      .map((inv) => this.toDto(inv));
  }

  async download(
    id: string,
    requestingUserId: string,
  ): Promise<{ buffer: Buffer; fileName: string; fileType: string }> {
    const invoice = await this.repository.findById(id);
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');

    if (invoice.uploadedBy !== requestingUserId) {
      throw new ForbiddenException('Sem permissão para acessar esta nota fiscal');
    }

    const buffer = await this.repository.findContentById(id);
    if (!buffer) throw new NotFoundException('Conteúdo não encontrado');

    return { buffer, fileName: invoice.fileName, fileType: invoice.fileType };
  }

  async remove(id: string, requestingUserId: string): Promise<void> {
    const invoice = await this.repository.findById(id);
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');

    if (invoice.uploadedBy !== requestingUserId) {
      throw new ForbiddenException('Sem permissão para remover esta nota fiscal');
    }

    await this.repository.delete(id);
  }

  private async assertContentMatchesMime(
    file: Express.Multer.File,
  ): Promise<void> {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    if (XML_TEXT_MIMES.has(file.mimetype)) {
      const head = file.buffer.subarray(0, 256).toString('utf8').trimStart();
      if (!head.startsWith('<')) {
        throw new BadRequestException('Conteúdo XML inválido');
      }
      return;
    }

    const detected = await fromBuffer(file.buffer);
    if (!detected) {
      throw new BadRequestException('Não foi possível verificar o tipo do arquivo');
    }
    if (detected.mime !== file.mimetype) {
      throw new BadRequestException(
        `Conteúdo do arquivo (${detected.mime}) não corresponde ao tipo declarado (${file.mimetype})`,
      );
    }
  }

  private toDto(invoice: Invoice, persistedCreatedAt?: Date): InvoiceDto {
    return {
      id: invoice.id,
      paymentId: invoice.paymentId,
      fileName: invoice.fileName,
      fileType: invoice.fileType,
      fileSize: invoice.fileSize,
      uploadedBy: invoice.uploadedBy,
      createdAt: persistedCreatedAt ?? invoice.createdAt!,
    };
  }
}

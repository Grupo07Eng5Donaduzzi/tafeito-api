import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Invoice } from '../../domain/models/invoice.entity';
import type { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { INVOICE_REPOSITORY } from '../../domain/repositories/invoice-repository.interface';
import { FirebaseStorageService } from '../../../../shared/infra/storage/firebase-storage.service';
import { InvoiceDto, DownloadUrlDto } from '../dto/invoice.dto';

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/xml': 'xml',
  'text/xml': 'xml',
};

const SIGNED_URL_TTL_MS = 60 * 60 * 1000; // 1 hora

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly repository: InvoiceRepository,
    private readonly storageService: FirebaseStorageService,
  ) {}

  async upload(params: {
    paymentId: string;
    file: Express.Multer.File;
    uploadedByUserId: string;
  }): Promise<InvoiceDto> {
    const { paymentId, file, uploadedByUserId } = params;

    const extension = MIME_TO_EXT[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Arquivo excede o tamanho máximo de 10MB');
    }

    const filePath = await this.storageService.upload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      folder: `invoices/${paymentId}`,
      extension,
    });

    const invoice = Invoice.create({
      paymentId,
      filePath,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: uploadedByUserId,
    });

    await this.repository.create(invoice);

    return this.toDto(invoice);
  }

  async listByPayment(paymentId: string): Promise<InvoiceDto[]> {
    const invoices = await this.repository.findByPaymentId(paymentId);
    return invoices.map((inv) => this.toDto(inv));
  }

  async getDownloadUrl(id: string): Promise<DownloadUrlDto> {
    const invoice = await this.repository.findById(id);
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');

    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_MS);
    const downloadUrl = await this.storageService.getSignedUrl(
      invoice.filePath,
      SIGNED_URL_TTL_MS,
    );

    return { downloadUrl, expiresAt };
  }

  async remove(id: string, requestingUserId: string): Promise<void> {
    const invoice = await this.repository.findById(id);
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');

    if (invoice.uploadedBy !== requestingUserId) {
      throw new ForbiddenException('Sem permissão para remover esta nota fiscal');
    }

    await this.storageService.delete(invoice.filePath);
    await this.repository.delete(id);
  }

  private toDto(invoice: Invoice): InvoiceDto {
    return {
      id: invoice.id,
      paymentId: invoice.paymentId,
      fileName: invoice.fileName,
      fileType: invoice.fileType,
      fileSize: invoice.fileSize,
      uploadedBy: invoice.uploadedBy,
      createdAt: invoice.createdAt ?? new Date(),
    };
  }
}

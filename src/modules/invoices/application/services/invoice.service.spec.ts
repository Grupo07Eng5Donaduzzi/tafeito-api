import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { FirebaseStorageService } from '../../../../shared/infra/storage/firebase-storage.service';
import { Invoice } from '../../domain/models/invoice.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const mockRepository: jest.Mocked<InvoiceRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByPaymentId: jest.fn(),
  delete: jest.fn(),
};

const mockStorage: jest.Mocked<FirebaseStorageService> = {
  upload: jest.fn(),
  getSignedUrl: jest.fn(),
  delete: jest.fn(),
} as any;

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvoiceService(mockRepository, mockStorage);
  });

  describe('upload', () => {
    it('faz upload e persiste invoice', async () => {
      mockStorage.upload.mockResolvedValue('invoices/123/abc.pdf');
      mockRepository.create.mockResolvedValue(undefined);

      const result = await service.upload({
        paymentId: '123',
        file: {
          buffer: Buffer.from('pdf content'),
          originalname: 'nota.pdf',
          mimetype: 'application/pdf',
          size: 1024,
        } as Express.Multer.File,
        uploadedByUserId: 'user-uuid-1',
      });

      expect(mockStorage.upload).toHaveBeenCalledWith({
        buffer: expect.any(Buffer),
        mimeType: 'application/pdf',
        folder: 'invoices/123',
        extension: 'pdf',
      });
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result.paymentId).toBe('123');
      expect(result.fileName).toBe('nota.pdf');
    });

    it('lança BadRequestException se tipo MIME inválido', async () => {
      await expect(
        service.upload({
          paymentId: '123',
          file: {
            buffer: Buffer.from('exe content'),
            originalname: 'malware.exe',
            mimetype: 'application/x-msdownload',
            size: 1024,
          } as Express.Multer.File,
          uploadedByUserId: 'user-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException se arquivo > 10MB', async () => {
      await expect(
        service.upload({
          paymentId: '123',
          file: {
            buffer: Buffer.alloc(11 * 1024 * 1024),
            originalname: 'big.pdf',
            mimetype: 'application/pdf',
            size: 11 * 1024 * 1024,
          } as Express.Multer.File,
          uploadedByUserId: 'user-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDownloadUrl', () => {
    it('retorna URL assinada e expiresAt', async () => {
      const invoice = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        filePath: 'invoices/123/abc.pdf',
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user-uuid-1',
        createdAt: new Date(),
      });
      mockRepository.findById.mockResolvedValue(invoice);
      mockStorage.getSignedUrl.mockResolvedValue('https://storage.googleapis.com/signed');

      const result = await service.getDownloadUrl('inv-1');

      expect(result.downloadUrl).toBe('https://storage.googleapis.com/signed');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('lança NotFoundException se invoice não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.getDownloadUrl('inv-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deleta invoice se usuário é o uploader', async () => {
      const invoice = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        filePath: 'invoices/123/abc.pdf',
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user-uuid-1',
        createdAt: new Date(),
      });
      mockRepository.findById.mockResolvedValue(invoice);
      mockStorage.delete.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove('inv-1', 'user-uuid-1');

      expect(mockStorage.delete).toHaveBeenCalledWith('invoices/123/abc.pdf');
      expect(mockRepository.delete).toHaveBeenCalledWith('inv-1');
    });

    it('lança ForbiddenException se usuário não é o uploader', async () => {
      const invoice = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        filePath: 'invoices/123/abc.pdf',
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user-uuid-1',
        createdAt: new Date(),
      });
      mockRepository.findById.mockResolvedValue(invoice);

      await expect(service.remove('inv-1', 'outro-user')).rejects.toThrow(ForbiddenException);
    });

    it('lança NotFoundException se invoice não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.remove('inv-999', 'user-uuid-1')).rejects.toThrow(NotFoundException);
    });
  });
});

import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { FirebaseStorageService } from '../../../../shared/infra/storage/firebase-storage.service';
import { Invoice } from '../../domain/models/invoice.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const PDF_BUFFER = Buffer.concat([
  Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary'),
  Buffer.alloc(64),
]);
const JPEG_BUFFER = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  Buffer.alloc(32),
]);
const XML_BUFFER = Buffer.from('<?xml version="1.0"?><nfe/>', 'utf8');

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
    it('persists PDF when magic bytes match mime', async () => {
      const persisted = new Date('2026-01-01T00:00:00Z');
      mockStorage.upload.mockResolvedValue('invoices/123/abc.pdf');
      mockRepository.create.mockResolvedValue(persisted);

      const result = await service.upload({
        paymentId: '123',
        file: {
          buffer: PDF_BUFFER,
          originalname: 'nota fiscal.pdf',
          mimetype: 'application/pdf',
          size: PDF_BUFFER.length,
        } as Express.Multer.File,
        uploadedByUserId: 'user-uuid-1',
      });

      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result.paymentId).toBe('123');
      expect(result.fileName).toBe('nota_fiscal.pdf');
      expect(result.createdAt).toBe(persisted);
    });

    it('persists JPEG when magic bytes match mime', async () => {
      mockStorage.upload.mockResolvedValue('invoices/123/abc.jpg');
      mockRepository.create.mockResolvedValue(new Date());

      const result = await service.upload({
        paymentId: '123',
        file: {
          buffer: JPEG_BUFFER,
          originalname: 'foto.jpg',
          mimetype: 'image/jpeg',
          size: JPEG_BUFFER.length,
        } as Express.Multer.File,
        uploadedByUserId: 'user-uuid-1',
      });

      expect(result.fileType).toBe('image/jpeg');
    });

    it('accepts XML when content starts with <', async () => {
      mockStorage.upload.mockResolvedValue('invoices/123/abc.xml');
      mockRepository.create.mockResolvedValue(new Date());

      const result = await service.upload({
        paymentId: '123',
        file: {
          buffer: XML_BUFFER,
          originalname: 'nfe.xml',
          mimetype: 'application/xml',
          size: XML_BUFFER.length,
        } as Express.Multer.File,
        uploadedByUserId: 'user-uuid-1',
      });

      expect(result.fileType).toBe('application/xml');
    });

    it('rejects when declared MIME is not allowed', async () => {
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

    it('rejects when content does not match declared MIME', async () => {
      await expect(
        service.upload({
          paymentId: '123',
          file: {
            buffer: Buffer.from('not a pdf at all'),
            originalname: 'fake.pdf',
            mimetype: 'application/pdf',
            size: 16,
          } as Express.Multer.File,
          uploadedByUserId: 'user-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects XML when content does not start with <', async () => {
      await expect(
        service.upload({
          paymentId: '123',
          file: {
            buffer: Buffer.from('not xml'),
            originalname: 'fake.xml',
            mimetype: 'application/xml',
            size: 7,
          } as Express.Multer.File,
          uploadedByUserId: 'user-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listByPayment', () => {
    it('returns only invoices uploaded by the requesting user', async () => {
      const mine = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        filePath: 'invoices/123/a.pdf',
        fileName: 'a.pdf',
        fileType: 'application/pdf',
        fileSize: 100,
        uploadedBy: 'user-1',
        createdAt: new Date(),
      });
      const someoneElse = Invoice.restore({
        id: 'inv-2',
        paymentId: '123',
        filePath: 'invoices/123/b.pdf',
        fileName: 'b.pdf',
        fileType: 'application/pdf',
        fileSize: 100,
        uploadedBy: 'user-2',
        createdAt: new Date(),
      });
      mockRepository.findByPaymentId.mockResolvedValue([mine, someoneElse]);

      const result = await service.listByPayment('123', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv-1');
    });
  });

  describe('getDownloadUrl', () => {
    it('retorna URL assinada quando usuário é o uploader', async () => {
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

      const result = await service.getDownloadUrl('inv-1', 'user-uuid-1');

      expect(result.downloadUrl).toBe('https://storage.googleapis.com/signed');
      expect(result.expiresAt).toBeInstanceOf(Date);
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

      await expect(service.getDownloadUrl('inv-1', 'outro')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lança NotFoundException se invoice não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.getDownloadUrl('inv-999', 'u')).rejects.toThrow(
        NotFoundException,
      );
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

      await expect(service.remove('inv-1', 'outro-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lança NotFoundException se invoice não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.remove('inv-999', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

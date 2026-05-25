import { BadRequestException } from '@nestjs/common';
import { Invoice } from './invoice.entity';

const DUMMY_BUFFER = Buffer.from('dummy');

describe('Invoice', () => {
  describe('create', () => {
    it('cria invoice com campos corretos e id gerado', () => {
      const invoice = Invoice.create({
        paymentId: '123456',
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 204800,
        fileData: DUMMY_BUFFER,
        uploadedBy: 'user-uuid-1',
      });

      expect(invoice.paymentId).toBe('123456');
      expect(invoice.fileName).toBe('nota.pdf');
      expect(invoice.fileType).toBe('application/pdf');
      expect(invoice.fileSize).toBe(204800);
      expect(invoice.fileData).toBe(DUMMY_BUFFER);
      expect(invoice.uploadedBy).toBe('user-uuid-1');
      expect(invoice.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(invoice.createdAt).toBeUndefined();
    });

    it('sanitizes path traversal attempts in fileName', () => {
      const invoice = Invoice.create({
        paymentId: '123',
        fileName: '../../etc/passwd',
        fileType: 'application/pdf',
        fileSize: 100,
        fileData: DUMMY_BUFFER,
        uploadedBy: 'u',
      });
      expect(invoice.fileName).not.toContain('/');
      expect(invoice.fileName).not.toContain('..');
    });

    it('replaces unsafe characters in fileName', () => {
      const invoice = Invoice.create({
        paymentId: '123',
        fileName: 'nota fiscal $$$.pdf',
        fileType: 'application/pdf',
        fileSize: 100,
        fileData: DUMMY_BUFFER,
        uploadedBy: 'u',
      });
      expect(invoice.fileName).toBe('nota_fiscal____.pdf');
    });

    it('lança BadRequestException se fileType inválido', () => {
      expect(() =>
        Invoice.create({
          paymentId: '123456',
          fileName: 'malware.exe',
          fileType: 'application/x-msdownload',
          fileSize: 1024,
          fileData: DUMMY_BUFFER,
          uploadedBy: 'user-uuid-1',
        }),
      ).toThrow(BadRequestException);
    });

    it('lança BadRequestException se fileSize > 10MB', () => {
      expect(() =>
        Invoice.create({
          paymentId: '123456',
          fileName: 'big.pdf',
          fileType: 'application/pdf',
          fileSize: 11 * 1024 * 1024,
          fileData: DUMMY_BUFFER,
          uploadedBy: 'user-uuid-1',
        }),
      ).toThrow(BadRequestException);
    });

    it('lança BadRequestException se fileSize <= 0', () => {
      expect(() =>
        Invoice.create({
          paymentId: '123456',
          fileName: 'empty.pdf',
          fileType: 'application/pdf',
          fileSize: 0,
          fileData: DUMMY_BUFFER,
          uploadedBy: 'user-uuid-1',
        }),
      ).toThrow(BadRequestException);
    });

    it('lança BadRequestException se paymentId vazio', () => {
      expect(() =>
        Invoice.create({
          paymentId: '   ',
          fileName: 'a.pdf',
          fileType: 'application/pdf',
          fileSize: 100,
          fileData: DUMMY_BUFFER,
          uploadedBy: 'u',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('restore', () => {
    it('restaura invoice com id e createdAt', () => {
      const now = new Date();
      const invoice = Invoice.restore({
        id: 'inv-uuid',
        paymentId: '123456',
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 204800,
        fileData: DUMMY_BUFFER,
        uploadedBy: 'user-uuid-1',
        createdAt: now,
      });

      expect(invoice.id).toBe('inv-uuid');
      expect(invoice.createdAt).toBe(now);
      expect(invoice.fileData).toBe(DUMMY_BUFFER);
    });
  });
});

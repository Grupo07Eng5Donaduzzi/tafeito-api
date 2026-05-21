import { Invoice } from './invoice.entity';

describe('Invoice', () => {
  describe('create', () => {
    it('cria invoice com campos corretos e id gerado', () => {
      const invoice = Invoice.create({
        paymentId: '123456',
        filePath: 'invoices/123456/abc.pdf',
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 204800,
        uploadedBy: 'user-uuid-1',
      });

      expect(invoice.paymentId).toBe('123456');
      expect(invoice.filePath).toBe('invoices/123456/abc.pdf');
      expect(invoice.fileName).toBe('nota.pdf');
      expect(invoice.fileType).toBe('application/pdf');
      expect(invoice.fileSize).toBe(204800);
      expect(invoice.uploadedBy).toBe('user-uuid-1');
      expect(invoice.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(invoice.createdAt).toBeUndefined();
    });

    it('lança erro se fileType inválido', () => {
      expect(() =>
        Invoice.create({
          paymentId: '123456',
          filePath: 'invoices/123456/abc.exe',
          fileName: 'malware.exe',
          fileType: 'application/x-msdownload',
          fileSize: 1024,
          uploadedBy: 'user-uuid-1',
        }),
      ).toThrow('Tipo de arquivo não permitido');
    });

    it('lança erro se fileSize > 10MB', () => {
      expect(() =>
        Invoice.create({
          paymentId: '123456',
          filePath: 'invoices/123456/big.pdf',
          fileName: 'big.pdf',
          fileType: 'application/pdf',
          fileSize: 11 * 1024 * 1024,
          uploadedBy: 'user-uuid-1',
        }),
      ).toThrow('Arquivo excede o tamanho máximo de 10MB');
    });
  });

  describe('restore', () => {
    it('restaura invoice com id e createdAt', () => {
      const now = new Date();
      const invoice = Invoice.restore({
        id: 'inv-uuid',
        paymentId: '123456',
        filePath: 'invoices/123456/abc.pdf',
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 204800,
        uploadedBy: 'user-uuid-1',
        createdAt: now,
      });

      expect(invoice.id).toBe('inv-uuid');
      expect(invoice.createdAt).toBe(now);
    });
  });
});

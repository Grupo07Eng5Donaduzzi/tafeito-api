import type { Invoice } from '../models/invoice.entity';

export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');

export interface InvoiceRepository {
  create(invoice: Invoice): Promise<Date>;
  findById(id: string): Promise<Invoice | null>;
  findByPaymentId(paymentId: string): Promise<Invoice[]>;
  delete(id: string): Promise<void>;
}

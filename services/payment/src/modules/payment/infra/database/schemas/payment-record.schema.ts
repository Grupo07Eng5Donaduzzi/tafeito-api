import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';

export const paymentRecordsSchema = pgTable('payment_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: text('proposal_id').notNull().unique(),
  asaasPaymentId: text('asaas_payment_id').notNull(),
  qrCode: text('qr_code').notNull(),
  qrCodeBase64: text('qr_code_base64').notNull(),
  ticketUrl: text('ticket_url'),
  status: text('status').notNull().default('PENDING'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { budgetRequestsSchema } from '../../../budget-requests/infra/schemas/budget-request.schema';
import { usersSchema } from '../../../users/infra/schemas/user.schema';

export const proposalStatusEnum = pgEnum('proposal_status', [
  'PENDING',
  'NEGOTIATING',
  'AWAITING_PAYMENT',
  'ACCEPTED',
  'PROVIDER_CONFIRMED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]);

export const proposalsSchema = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => budgetRequestsSchema.id).notNull(),
  clientId: uuid('client_id').references(() => usersSchema.id).notNull(),
  providerId: uuid('provider_id').references(() => usersSchema.id).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: proposalStatusEnum('status').notNull().default('PENDING'),
  rejectionReason: text('rejection_reason'),
  canResubmit: boolean('can_resubmit').notNull().default(true),
  paymentId: text('payment_id'),
  qrCode: text('qr_code'),
  qrCodeBase64: text('qr_code_base64'),
  ticketUrl: text('ticket_url'),
  invoiceFile: text('invoice_file'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

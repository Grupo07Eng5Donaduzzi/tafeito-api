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
import { conversationSchema } from '../../../chat/infra/schemas/conversation.schema';
import { usersSchema } from '../../../users/infra/schemas/user.schema';

export const proposalStatusEnum = pgEnum('proposal_status', [
  'PENDING',
  'NEGOTIATING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
]);

export const senderRoleEnum = pgEnum('sender_role', ['CLIENT', 'PROVIDER']);

export const proposalsSchema = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id')
    .references(() => budgetRequestsSchema.id)
    .notNull(),
  clientId: uuid('client_id')
    .references(() => usersSchema.id)
    .notNull(),
  providerId: uuid('provider_id')
    .references(() => usersSchema.id)
    .notNull(),
  estimatedHours: numeric('estimated_hours', {
    precision: 10,
    scale: 2,
  }).notNull(),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: proposalStatusEnum('status').notNull().default('PENDING'),
  rejectionReason: text('rejection_reason'),
  linkedChatId: uuid('linked_chat_id').references(() => conversationSchema.id),
  canResubmit: boolean('can_resubmit').notNull().default(true),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const negotiationMessagesSchema = pgTable('negotiation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').notNull(),
  senderRole: senderRoleEnum('sender_role').notNull(),
  senderUserId: uuid('sender_user_id').notNull(),
  message: text('message').notNull(),
  revisedAmount: numeric('revised_amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').notNull(),
});

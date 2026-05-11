import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../services/infra/schemas/service.schema';

export const conversationSchema = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .references(() => servicesSchema.id)
      .notNull(),
    proposalId: uuid('proposal_id'),
    initiatorId: uuid('initiator_id')
      .references(() => usersSchema.id)
      .notNull(),
    participantIds: text('participant_ids').array().notNull(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    serviceIdIdx: index('conversations_service_id_idx').on(table.serviceId),
    proposalIdIdx: index('conversations_proposal_id_idx').on(table.proposalId),
  }),
);

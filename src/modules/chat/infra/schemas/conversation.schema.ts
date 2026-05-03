import {
  pgTable,
  timestamp,
  uuid,
  uuid as pgUuid,
  index,
  boolean,
} from 'drizzle-orm/pg-core';

export const conversationSchema = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id').notNull(),
    initiatorId: uuid('initiator_id').notNull(),
    participantIds: pgUuid('participant_ids').array().notNull(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    serviceIdIdx: index('conversations_service_id_idx').on(table.serviceId),
    serviceIdLastMessageAtIdx: index(
      'conversations_service_id_last_message_at_idx',
    ).on(table.serviceId, table.lastMessageAt),
  }),
);

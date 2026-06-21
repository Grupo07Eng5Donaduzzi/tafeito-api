import { pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';

export const conversationSchema = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    initiatorId: uuid('initiator_id').notNull(),
    participantIds: text('participant_ids').array().notNull(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    initiatorIdIdx: index('conversations_initiator_id_idx').on(table.initiatorId),
  }),
);

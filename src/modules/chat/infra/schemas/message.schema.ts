import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const messageSchema = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id').notNull(),
    senderId: uuid('sender_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    content: text('content').notNull(),
    status: text('status', {
      enum: ['sent', 'delivered', 'read'],
    })
      .notNull()
      .default('sent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    serviceIdCreatedAtIdx: index('messages_service_id_created_at_idx').on(
      table.serviceId,
      table.createdAt,
    ),
    senderIdCreatedAtIdx: index('messages_sender_id_created_at_idx').on(
      table.senderId,
      table.createdAt,
    ),
    serviceIdSenderIdIdx: index('messages_service_id_sender_id_idx').on(
      table.serviceId,
      table.senderId,
    ),
  }),
);

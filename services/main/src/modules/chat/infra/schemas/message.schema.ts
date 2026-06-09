import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../services/infra/schemas/service.schema';
import { conversationSchema } from './conversation.schema';

export const messageSchema = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .references(() => servicesSchema.id)
      .notNull(),
    conversationId: uuid('conversation_id').references(
      () => conversationSchema.id,
    ),
    senderId: uuid('sender_id')
      .references(() => usersSchema.id)
      .notNull(),
    recipientId: uuid('recipient_id')
      .references(() => usersSchema.id)
      .notNull(),
    content: text('content').notNull(),
    status: text('status', { enum: ['sent', 'delivered', 'read'] })
      .notNull()
      .default('sent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    serviceIdIdx: index('messages_service_id_idx').on(table.serviceId),
    conversationIdIdx: index('messages_conversation_id_idx').on(
      table.conversationId,
    ),
    createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
    senderIdIdx: index('messages_sender_id_idx').on(table.senderId),
  }),
);

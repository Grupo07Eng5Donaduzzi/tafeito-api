import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const adminsSchema = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUuid: text('firebase_uuid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const adminAuditLogsSchema = pgTable('admin_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id')
    .references(() => adminsSchema.id)
    .notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id'),
  description: text('description').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export const chatConversationsSchema = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  participantIds: text('participant_ids').array().notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const chatMessagesSchema = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull(),
  conversationId: uuid('conversation_id'),
  senderId: uuid('sender_id').notNull(),
  recipientId: uuid('recipient_id').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default('sent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

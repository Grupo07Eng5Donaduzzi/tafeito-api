import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { usersSchema } from '../../users/infra/schemas/user.schema';

export const auditLogsSchema = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: text('action').notNull(),
  userId: uuid('user_id').references(() => usersSchema.id),
  targetId: text('target_id').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

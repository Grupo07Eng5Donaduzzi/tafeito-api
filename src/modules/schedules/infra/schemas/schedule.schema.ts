import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { budgetRequestsSchema } from '../../../budget-requests/infra/schemas/budget-request.schema';

export const schedulesSchema = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetRequestId: uuid('budget_request_id')
    .references(() => budgetRequestsSchema.id)
    .notNull(),
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

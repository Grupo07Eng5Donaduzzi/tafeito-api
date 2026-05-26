import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { proposalsSchema } from '../../../proposal/infra/schemas/proposal.schema';
import { budgetRequestsSchema } from '../../../budget-requests/infra/schemas/budget-request.schema';

export const schedulesSchema = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .references(() => proposalsSchema.id)
    .notNull(),
  budgetRequestId: uuid('budget_request_id')
    .references(() => budgetRequestsSchema.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

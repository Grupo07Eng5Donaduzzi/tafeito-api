import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { proposalsSchema } from '../../../proposal/infra/schemas/proposal.schema';

export const schedulesSchema = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .references(() => proposalsSchema.id)
    .notNull(),
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

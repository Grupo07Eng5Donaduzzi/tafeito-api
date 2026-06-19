import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { usersSchema } from '../../../users/infra/schemas/user.schema';
import { budgetRequestsSchema } from './budget-request.schema';

export const providerDeclinesSchema = pgTable(
  'provider_declines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    providerId: uuid('provider_id')
      .references(() => usersSchema.id)
      .notNull(),
    budgetRequestId: uuid('budget_request_id')
      .references(() => budgetRequestsSchema.id)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    uniq: unique().on(table.providerId, table.budgetRequestId),
  }),
);

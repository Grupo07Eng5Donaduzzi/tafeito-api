import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../services/infra/schemas/service.schema';

export const statusEnum = pgEnum('status', [
  'pending',
  'answered',
  'accepted',
  'cancelled',
]);

export const budgetRequestsSchema = pgTable('budget_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => usersSchema.id)
    .notNull(),
  serviceId: uuid('service_id')
    .references(() => servicesSchema.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  location: text('location').notNull(),
  requestDate: timestamp('request_date', { withTimezone: true }).notNull(),
  status: statusEnum('status').notNull().default('pending'),
  photos: jsonb('photos'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

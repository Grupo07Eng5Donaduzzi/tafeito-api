import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { proposalsSchema } from '../../../proposal/infra/schemas/proposal.schema';

export const reviewsSchema = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .references(() => proposalsSchema.id)
    .notNull()
    .unique(),
  reviewerId: uuid('reviewer_id')
    .references(() => usersSchema.id)
    .notNull(),
  reviewedId: uuid('reviewed_id')
    .references(() => usersSchema.id)
    .notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

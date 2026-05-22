import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { proposalsSchema } from '../../../proposal/infra/schemas/proposal.schema';

export const reviewsSchema = pgTable(
  'reviews',
  {
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
  },
  (t) => ({
    ratingCheck: check('reviews_rating_check', sql`${t.rating} BETWEEN 1 AND 5`),
    reviewedIdIdx: index('reviews_reviewed_id_idx').on(t.reviewedId),
    reviewedIdCreatedAtIdx: index('reviews_reviewed_id_created_at_idx').on(
      t.reviewedId,
      t.createdAt,
    ),
  }),
);

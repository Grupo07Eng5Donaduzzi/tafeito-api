import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../services/infra/schemas/service.schema';

export const reviewsSchema = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .references(() => servicesSchema.id)
      .notNull(),
    reviewerId: uuid('reviewer_id')
      .references(() => usersSchema.id)
      .notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    ratingCheck: check('reviews_rating_check', sql`${t.rating} BETWEEN 1 AND 5`),
    uniqueServiceReviewer: unique('reviews_service_reviewer_unique').on(t.serviceId, t.reviewerId),
    serviceIdIdx: index('reviews_service_id_idx').on(t.serviceId),
  }),
);

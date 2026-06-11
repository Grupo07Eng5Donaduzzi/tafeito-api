import { pgTable, text, timestamp, uuid, numeric } from 'drizzle-orm/pg-core';

export const servicesSchema = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  pricingType: text('pricing_type').notNull().default('HOURLY'),
  photo: text('photo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

import { numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const usersSchema = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  identification: text('identification').notNull().unique(), // CPF or CNPJ
  pixKey: text('pix_key'),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

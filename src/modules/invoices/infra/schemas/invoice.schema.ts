import { pgTable, uuid, text, integer, timestamp, customType } from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';

const bytea = customType<{ data: Buffer; notNull: true; default: false }>({
  dataType() {
    return 'bytea';
  },
});

export const invoicesSchema = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: text('payment_id').notNull(),
  fileContent: bytea('file_content').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadedBy: uuid('uploaded_by')
    .references(() => usersSchema.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

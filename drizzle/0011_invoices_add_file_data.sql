ALTER TABLE "invoices" ADD COLUMN "file_data" bytea NOT NULL DEFAULT '\x';
ALTER TABLE "invoices" ALTER COLUMN "file_data" DROP DEFAULT;

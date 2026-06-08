ALTER TYPE "public"."proposal_status" ADD VALUE 'AWAITING_PAYMENT';--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "payment_id" text;

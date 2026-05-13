DO $$ BEGIN
 CREATE TYPE "public"."proposal_status" AS ENUM('PENDING', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TYPE "public"."proposal_status" ADD VALUE IF NOT EXISTS 'REJECTED';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sender_role" AS ENUM('CLIENT', 'PROVIDER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "budget_requests" ADD COLUMN IF NOT EXISTS "title" text;
--> statement-breakpoint
ALTER TABLE "budget_requests" ADD COLUMN IF NOT EXISTS "category" text;
--> statement-breakpoint
ALTER TABLE "budget_requests" ADD COLUMN IF NOT EXISTS "location" text;
--> statement-breakpoint
UPDATE "budget_requests"
SET
  "title" = COALESCE("title", LEFT("description", 80)),
  "category" = COALESCE("category", 'general'),
  "location" = COALESCE("location", 'not_informed')
WHERE "title" IS NULL OR "category" IS NULL OR "location" IS NULL;
--> statement-breakpoint
ALTER TABLE "budget_requests" ALTER COLUMN "title" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "budget_requests" ALTER COLUMN "category" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "budget_requests" ALTER COLUMN "location" SET NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "client_id" uuid,
  "provider_id" uuid NOT NULL,
  "estimated_hours" numeric(10, 2),
  "hourly_rate" numeric(10, 2),
  "amount" numeric(10, 2) NOT NULL,
  "status" "proposal_status" DEFAULT 'PENDING' NOT NULL,
  "rejection_reason" text,
  "linked_chat_id" uuid,
  "can_resubmit" boolean DEFAULT true NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "negotiation_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proposal_id" uuid NOT NULL,
  "sender_role" "sender_role" NOT NULL,
  "sender_user_id" uuid NOT NULL,
  "message" text NOT NULL,
  "revised_amount" numeric(10, 2),
  "created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "client_id" uuid;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "estimated_hours" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "hourly_rate" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "linked_chat_id" uuid;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "proposal_id" uuid;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "conversation_id" uuid;
--> statement-breakpoint
UPDATE "proposals"
SET "client_id" = "budget_requests"."user_id"
FROM "budget_requests"
WHERE "proposals"."request_id" = "budget_requests"."id"
  AND "proposals"."client_id" IS NULL;
--> statement-breakpoint
UPDATE "proposals"
SET
  "estimated_hours" = COALESCE("proposals"."estimated_hours", 1),
  "hourly_rate" = COALESCE("proposals"."hourly_rate", "users"."hourly_rate", "proposals"."amount")
FROM "users"
WHERE "proposals"."provider_id" = "users"."id"
  AND ("proposals"."estimated_hours" IS NULL OR "proposals"."hourly_rate" IS NULL);
--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "client_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "estimated_hours" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "hourly_rate" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposals" ADD CONSTRAINT "proposals_request_id_budget_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."budget_requests"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposals" ADD CONSTRAINT "proposals_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposals" ADD CONSTRAINT "proposals_linked_chat_id_conversations_id_fk" FOREIGN KEY ("linked_chat_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "negotiation_messages" ADD CONSTRAINT "negotiation_messages_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_proposal_id_idx" ON "conversations" USING btree ("proposal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");

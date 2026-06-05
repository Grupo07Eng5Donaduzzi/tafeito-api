CREATE TYPE "public"."status" AS ENUM('pending', 'answered', 'cancelled');
CREATE TYPE "public"."proposal_status" AS ENUM('PENDING', 'NEGOTIATING', 'ACCEPTED', 'PROVIDER_CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED');
CREATE TYPE "public"."sender_role" AS ENUM('CLIENT', 'PROVIDER');

CREATE TABLE "budget_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"location" text NOT NULL,
	"request_date" timestamp with time zone NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"photos" jsonb,
	"cancellation_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"proposal_id" uuid,
	"initiator_id" uuid NOT NULL,
	"participant_ids" text[] NOT NULL,
	"last_message_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"conversation_id" uuid,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "negotiation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"sender_role" "sender_role" NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"revised_amount" numeric(10, 2),
	"created_at" timestamp NOT NULL
);

CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"estimated_hours" numeric(10, 2) NOT NULL,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "proposal_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"linked_chat_id" uuid,
	"can_resubmit" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);

CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewed_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "reviews_proposal_id_unique" UNIQUE("proposal_id"),
	CONSTRAINT "reviews_rating_check" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);

CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"budget_request_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"duration" numeric NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"identification" text NOT NULL,
	"pix_key" text,
	"hourly_rate" numeric(10, 2),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_identification_unique" UNIQUE("identification")
);

ALTER TABLE "budget_requests" ADD CONSTRAINT "budget_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "budget_requests" ADD CONSTRAINT "budget_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_request_id_budget_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."budget_requests"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_linked_chat_id_conversations_id_fk" FOREIGN KEY ("linked_chat_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_id_users_id_fk" FOREIGN KEY ("reviewed_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_budget_request_id_budget_requests_id_fk" FOREIGN KEY ("budget_request_id") REFERENCES "public"."budget_requests"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "conversations_service_id_idx" ON "conversations" USING btree ("service_id");
CREATE INDEX "conversations_proposal_id_idx" ON "conversations" USING btree ("proposal_id");
CREATE INDEX "messages_service_id_idx" ON "messages" USING btree ("service_id");
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");
CREATE INDEX "messages_sender_id_idx" ON "messages" USING btree ("sender_id");
CREATE INDEX "reviews_reviewed_id_idx" ON "reviews" USING btree ("reviewed_id");
CREATE INDEX "reviews_reviewed_id_created_at_idx" ON "reviews" USING btree ("reviewed_id","created_at");

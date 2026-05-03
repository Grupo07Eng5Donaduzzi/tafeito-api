CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"initiator_id" uuid NOT NULL,
	"participant_ids" uuid[] NOT NULL,
	"last_message_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "conversations_service_id_idx" ON "conversations" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "conversations_service_id_last_message_at_idx" ON "conversations" USING btree ("service_id","last_message_at");--> statement-breakpoint
CREATE INDEX "messages_service_id_created_at_idx" ON "messages" USING btree ("service_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_sender_id_created_at_idx" ON "messages" USING btree ("sender_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_service_id_sender_id_idx" ON "messages" USING btree ("service_id","sender_id");
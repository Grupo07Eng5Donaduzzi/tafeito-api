CREATE TYPE "public"."status" AS ENUM('pending', 'answered', 'cancelled');--> statement-breakpoint
CREATE TABLE "budget_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"description" text NOT NULL,
	"request_date" timestamp with time zone NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"photos" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_requests" ADD CONSTRAINT "budget_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_requests" ADD CONSTRAINT "budget_requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;

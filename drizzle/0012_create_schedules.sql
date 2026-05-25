CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"budget_request_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_budget_request_id_budget_requests_id_fk" FOREIGN KEY ("budget_request_id") REFERENCES "public"."budget_requests"("id") ON DELETE no action ON UPDATE no action;

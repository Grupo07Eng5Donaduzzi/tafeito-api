ALTER TABLE "proposals" ALTER COLUMN "can_resubmit" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "can_resubmit" SET DEFAULT true;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_reviewed_id_idx" ON "reviews" USING btree ("reviewed_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_reviewed_id_created_at_idx" ON "reviews" USING btree ("reviewed_id","created_at");

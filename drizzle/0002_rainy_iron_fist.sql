-- Created by Drizzle
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"detailed_description" text NOT NULL,
	"category" text NOT NULL,
	"status" text NOT NULL DEFAULT 'OPEN',
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"latitude" decimal(10,7),
	"longitude" decimal(10,7),
	"images" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

-- Foreign Keys
ALTER TABLE "requests" ADD CONSTRAINT "requests_client_id_fkey" 
  FOREIGN KEY ("client_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for better query performance
CREATE INDEX "requests_category_idx" ON "requests" ("category");
CREATE INDEX "requests_city_idx" ON "requests" ("city");
CREATE INDEX "requests_client_id_idx" ON "requests" ("client_id");
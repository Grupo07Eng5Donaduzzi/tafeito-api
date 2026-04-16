-- Created by Drizzle
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"price" text NOT NULL,
	"status" text NOT NULL DEFAULT 'AVAILABLE',
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);

-- Foreign Keys
ALTER TABLE "services" ADD CONSTRAINT "services_provider_id_fkey" 
  FOREIGN KEY ("provider_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
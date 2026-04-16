import { pgTable, text, timestamp, uuid, pgEnum, decimal, jsonb } from "drizzle-orm/pg-core";

export const requestStatusEnum = pgEnum("request_status", [
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const requestCategoryEnum = pgEnum("request_category", [
  "CLEANING",
  "PLUMBING",
  "ELECTRICITY",
  "PAINTING",
  "CARPENTRY",
  "LANDSCAPING",
  "MOVING",
  "ASSEMBLY",
  "OTHER",
]);

export const requestsSchema = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull(),
  title: text("title").notNull(),
  detailedDescription: text("detailed_description").notNull(),
  category: requestCategoryEnum("category").notNull(),
  status: requestStatusEnum("status").notNull().default("OPEN"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  images: jsonb("images").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
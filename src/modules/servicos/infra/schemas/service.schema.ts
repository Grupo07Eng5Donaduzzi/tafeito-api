import { pgTable, text, timestamp, uuid, pgEnum, decimal } from "drizzle-orm/pg-core";

export const serviceStatusEnum = pgEnum("service_status", [
  "AVAILABLE",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const serviceCategoryEnum = pgEnum("service_category", [
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

export const servicesSchema = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: serviceCategoryEnum("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: serviceStatusEnum("status").notNull().default("AVAILABLE"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
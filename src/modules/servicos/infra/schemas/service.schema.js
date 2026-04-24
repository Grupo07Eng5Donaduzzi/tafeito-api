"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesSchema = exports.serviceCategoryEnum = exports.serviceStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.serviceStatusEnum = (0, pg_core_1.pgEnum)("service_status", [
    "AVAILABLE",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
]);
exports.serviceCategoryEnum = (0, pg_core_1.pgEnum)("service_category", [
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
exports.servicesSchema = (0, pg_core_1.pgTable)("services", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    providerId: (0, pg_core_1.uuid)("provider_id").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    category: (0, exports.serviceCategoryEnum)("category").notNull(),
    price: (0, pg_core_1.decimal)("price", { precision: 10, scale: 2 }).notNull(),
    status: (0, exports.serviceStatusEnum)("status").notNull().default("AVAILABLE"),
    address: (0, pg_core_1.text)("address").notNull(),
    city: (0, pg_core_1.text)("city").notNull(),
    state: (0, pg_core_1.text)("state").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).notNull(),
});
//# sourceMappingURL=service.schema.js.map
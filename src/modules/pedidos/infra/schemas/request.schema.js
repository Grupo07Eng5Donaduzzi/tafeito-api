"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestsSchema = exports.requestCategoryEnum = exports.requestStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.requestStatusEnum = (0, pg_core_1.pgEnum)("request_status", [
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
]);
exports.requestCategoryEnum = (0, pg_core_1.pgEnum)("request_category", [
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
exports.requestsSchema = (0, pg_core_1.pgTable)("requests", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    clientId: (0, pg_core_1.uuid)("client_id").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    detailedDescription: (0, pg_core_1.text)("detailed_description").notNull(),
    category: (0, exports.requestCategoryEnum)("category").notNull(),
    status: (0, exports.requestStatusEnum)("status").notNull().default("OPEN"),
    address: (0, pg_core_1.text)("address").notNull(),
    city: (0, pg_core_1.text)("city").notNull(),
    state: (0, pg_core_1.text)("state").notNull(),
    latitude: (0, pg_core_1.decimal)("latitude", { precision: 10, scale: 7 }),
    longitude: (0, pg_core_1.decimal)("longitude", { precision: 10, scale: 7 }),
    images: (0, pg_core_1.jsonb)("images").$type().default([]),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).notNull(),
});
//# sourceMappingURL=request.schema.js.map
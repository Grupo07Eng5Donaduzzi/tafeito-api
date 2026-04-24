"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersSchema = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.usersSchema = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    firebaseUid: (0, pg_core_1.text)("firebase_uid").notNull().unique(),
    name: (0, pg_core_1.text)("name").notNull(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    identification: (0, pg_core_1.text)("identification").notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).notNull(),
});
//# sourceMappingURL=user.schema.js.map
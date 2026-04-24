"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrizzleUserRepository = void 0;
const user_entity_1 = require("../../domain/models/user.entity");
const user_schema_1 = require("../schemas/user.schema");
const common_1 = require("@nestjs/common");
const drizzle_service_1 = require("../../../../shared/infra/database/drizzle.service");
const drizzle_orm_1 = require("drizzle-orm");
let DrizzleUserRepository = class DrizzleUserRepository {
    drizzleService;
    constructor(drizzleService) {
        this.drizzleService = drizzleService;
    }
    async create(user) {
        await this.drizzleService.db.insert(user_schema_1.usersSchema).values({
            firebaseUid: user.firebaseUid,
            name: user.name,
            email: user.email,
            identification: user.identification,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    async update(user) {
        await this.drizzleService.db
            .update(user_schema_1.usersSchema)
            .set({
            name: user.name,
            identification: user.identification,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(user_schema_1.usersSchema.id, user.id));
    }
    async delete(id) {
        await this.drizzleService.db
            .delete(user_schema_1.usersSchema)
            .where((0, drizzle_orm_1.eq)(user_schema_1.usersSchema.id, id));
    }
    async findById(id) {
        const result = await this.drizzleService.db
            .select()
            .from(user_schema_1.usersSchema)
            .where((0, drizzle_orm_1.eq)(user_schema_1.usersSchema.id, id))
            .limit(1);
        return user_entity_1.User.restore(result[0]);
    }
    async findByFirebaseUid(firebaseUid) {
        const result = await this.drizzleService.db
            .select()
            .from(user_schema_1.usersSchema)
            .where((0, drizzle_orm_1.eq)(user_schema_1.usersSchema.firebaseUid, firebaseUid))
            .limit(1);
        return user_entity_1.User.restore(result[0]);
    }
    async findByEmail(email) {
        const result = await this.drizzleService.db
            .select()
            .from(user_schema_1.usersSchema)
            .where((0, drizzle_orm_1.eq)(user_schema_1.usersSchema.email, email))
            .limit(1);
        return user_entity_1.User.restore(result[0]);
    }
    async findAll() {
        const rows = await this.drizzleService.db.select().from(user_schema_1.usersSchema);
        return rows.map((row) => user_entity_1.User.restore(row));
    }
};
exports.DrizzleUserRepository = DrizzleUserRepository;
exports.DrizzleUserRepository = DrizzleUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])
], DrizzleUserRepository);
//# sourceMappingURL=drizzle-user.repository.js.map
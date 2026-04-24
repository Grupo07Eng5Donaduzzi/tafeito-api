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
exports.DrizzleRequestRepository = void 0;
const request_entity_1 = require("../../domain/models/request.entity");
const request_schema_1 = require("../schemas/request.schema");
const common_1 = require("@nestjs/common");
const drizzle_service_1 = require("../../../../shared/infra/database/drizzle.service");
const drizzle_orm_1 = require("drizzle-orm");
let DrizzleRequestRepository = class DrizzleRequestRepository {
    drizzleService;
    constructor(drizzleService) {
        this.drizzleService = drizzleService;
    }
    async create(request) {
        await this.drizzleService.db.insert(request_schema_1.requestsSchema).values({
            clientId: request.clientId,
            title: request.title,
            detailedDescription: request.detailedDescription,
            category: request.category,
            status: request.status,
            address: request.address,
            city: request.city,
            state: request.state,
            latitude: request.latitude?.toString(),
            longitude: request.longitude?.toString(),
            images: request.images,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    async update(request) {
        await this.drizzleService.db
            .update(request_schema_1.requestsSchema)
            .set({
            title: request.title,
            detailedDescription: request.detailedDescription,
            category: request.category,
            address: request.address,
            city: request.city,
            state: request.state,
            latitude: request.latitude?.toString(),
            longitude: request.longitude?.toString(),
            images: request.images,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(request_schema_1.requestsSchema.id, request.id));
    }
    async delete(id) {
        await this.drizzleService.db
            .delete(request_schema_1.requestsSchema)
            .where((0, drizzle_orm_1.eq)(request_schema_1.requestsSchema.id, id));
    }
    async findAll() {
        const result = await this.drizzleService.db
            .select()
            .from(request_schema_1.requestsSchema)
            .orderBy(request_schema_1.requestsSchema.createdAt);
        return result.map(this.mapToEntity);
    }
    async findById(id) {
        const result = await this.drizzleService.db
            .select()
            .from(request_schema_1.requestsSchema)
            .where((0, drizzle_orm_1.eq)(request_schema_1.requestsSchema.id, id))
            .limit(1);
        return result[0] ? this.mapToEntity(result[0]) : null;
    }
    async findByClientId(clientId) {
        const result = await this.drizzleService.db
            .select()
            .from(request_schema_1.requestsSchema)
            .where((0, drizzle_orm_1.eq)(request_schema_1.requestsSchema.clientId, clientId))
            .orderBy(request_schema_1.requestsSchema.createdAt);
        return result.map(this.mapToEntity);
    }
    async findByCategory(category) {
        const result = await this.drizzleService.db
            .select()
            .from(request_schema_1.requestsSchema)
            .where((0, drizzle_orm_1.eq)(request_schema_1.requestsSchema.category, category))
            .orderBy(request_schema_1.requestsSchema.createdAt);
        return result.map(this.mapToEntity);
    }
    async findByCity(city) {
        const result = await this.drizzleService.db
            .select()
            .from(request_schema_1.requestsSchema)
            .where((0, drizzle_orm_1.ilike)(request_schema_1.requestsSchema.city, `%${city}%`))
            .orderBy(request_schema_1.requestsSchema.createdAt);
        return result.map(this.mapToEntity);
    }
    mapToEntity(row) {
        return request_entity_1.Request.restore({
            id: row.id,
            clientId: row.clientId,
            title: row.title,
            detailedDescription: row.detailedDescription,
            category: row.category,
            status: row.status,
            address: row.address,
            city: row.city,
            state: row.state,
            latitude: row.latitude ? Number(row.latitude) : undefined,
            longitude: row.longitude ? Number(row.longitude) : undefined,
            images: row.images || [],
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
};
exports.DrizzleRequestRepository = DrizzleRequestRepository;
exports.DrizzleRequestRepository = DrizzleRequestRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])
], DrizzleRequestRepository);
//# sourceMappingURL=drizzle-request.repository.js.map
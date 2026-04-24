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
exports.DrizzleServiceRepository = void 0;
const service_entity_1 = require("../../domain/models/service.entity");
const service_schema_1 = require("../schemas/service.schema");
const common_1 = require("@nestjs/common");
const drizzle_service_1 = require("../../../../shared/infra/database/drizzle.service");
const drizzle_orm_1 = require("drizzle-orm");
let DrizzleServiceRepository = class DrizzleServiceRepository {
    drizzleService;
    constructor(drizzleService) {
        this.drizzleService = drizzleService;
    }
    async create(service) {
        await this.drizzleService.db.insert(service_schema_1.servicesSchema).values({
            providerId: service.providerId,
            title: service.title,
            description: service.description,
            category: service.category,
            price: service.price.toString(),
            status: service.status,
            address: service.address,
            city: service.city,
            state: service.state,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    async update(service) {
        await this.drizzleService.db
            .update(service_schema_1.servicesSchema)
            .set({
            title: service.title,
            description: service.description,
            category: service.category,
            price: service.price.toString(),
            address: service.address,
            city: service.city,
            state: service.state,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(service_schema_1.servicesSchema.id, service.id));
    }
    async delete(id) {
        await this.drizzleService.db
            .delete(service_schema_1.servicesSchema)
            .where((0, drizzle_orm_1.eq)(service_schema_1.servicesSchema.id, id));
    }
    async findAll() {
        const result = await this.drizzleService.db
            .select()
            .from(service_schema_1.servicesSchema)
            .orderBy(service_schema_1.servicesSchema.createdAt);
        return result.map(this.mapToEntity);
    }
    async findById(id) {
        const result = await this.drizzleService.db
            .select()
            .from(service_schema_1.servicesSchema)
            .where((0, drizzle_orm_1.eq)(service_schema_1.servicesSchema.id, id))
            .limit(1);
        return result[0] ? this.mapToEntity(result[0]) : null;
    }
    async findByProviderId(providerId) {
        const result = await this.drizzleService.db
            .select()
            .from(service_schema_1.servicesSchema)
            .where((0, drizzle_orm_1.eq)(service_schema_1.servicesSchema.providerId, providerId))
            .orderBy(service_schema_1.servicesSchema.createdAt);
        return result.map(this.mapToEntity);
    }
    mapToEntity(row) {
        return service_entity_1.Service.restore({
            id: row.id,
            providerId: row.providerId,
            title: row.title,
            description: row.description,
            category: row.category,
            price: Number(row.price),
            status: row.status,
            address: row.address,
            city: row.city,
            state: row.state,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
};
exports.DrizzleServiceRepository = DrizzleServiceRepository;
exports.DrizzleServiceRepository = DrizzleServiceRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])
], DrizzleServiceRepository);
//# sourceMappingURL=drizzle-service.repository.js.map
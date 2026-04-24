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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const service_dto_1 = require("../dto/service.dto");
const service_entity_1 = require("../../domain/models/service.entity");
const service_repository_interface_1 = require("../../domain/repositories/service-repository.interface");
const common_1 = require("@nestjs/common");
let ServiceService = class ServiceService {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async create(providerId, dto) {
        const service = service_entity_1.Service.create({
            providerId,
            title: dto.title,
            description: dto.description,
            category: dto.category,
            price: dto.price,
            address: dto.address,
            city: dto.city,
            state: dto.state,
        });
        await this.serviceRepository.create(service);
        const created = await this.serviceRepository.findById(service.id);
        return service_dto_1.ServiceDto.from(created);
    }
    async list() {
        const services = await this.serviceRepository.findAll();
        return services.map(service_dto_1.ServiceDto.from);
    }
    async findById(id) {
        const service = await this.serviceRepository.findById(id);
        if (!service)
            throw new common_1.NotFoundException();
        return service_dto_1.ServiceDto.from(service);
    }
    async findByProviderId(providerId) {
        const services = await this.serviceRepository.findByProviderId(providerId);
        return services.map(service_dto_1.ServiceDto.from);
    }
    async edit(id, providerId, dto) {
        const service = await this.serviceRepository.findById(id);
        if (!service)
            throw new common_1.NotFoundException();
        if (service.providerId !== providerId) {
            throw new common_1.NotFoundException();
        }
        if (dto.title)
            service["_title"] = dto.title;
        if (dto.description)
            service["_description"] = dto.description;
        if (dto.category)
            service["_category"] = dto.category;
        if (dto.price)
            service["_price"] = dto.price;
        if (dto.address)
            service["_address"] = dto.address;
        if (dto.city)
            service["_city"] = dto.city;
        if (dto.state)
            service["_state"] = dto.state;
        await this.serviceRepository.update(service);
        const updated = await this.serviceRepository.findById(id);
        return service_dto_1.ServiceDto.from(updated);
    }
    async remove(id, providerId) {
        const service = await this.serviceRepository.findById(id);
        if (!service)
            throw new common_1.NotFoundException();
        if (service.providerId !== providerId) {
            throw new common_1.NotFoundException();
        }
        await this.serviceRepository.delete(id);
    }
};
exports.ServiceService = ServiceService;
exports.ServiceService = ServiceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(service_repository_interface_1.SERVICE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ServiceService);
//# sourceMappingURL=service.service.js.map
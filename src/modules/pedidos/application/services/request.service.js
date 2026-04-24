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
exports.RequestService = void 0;
const request_dto_1 = require("../dto/request.dto");
const request_entity_1 = require("../../domain/models/request.entity");
const request_repository_interface_1 = require("../../domain/repositories/request-repository.interface");
const common_1 = require("@nestjs/common");
let RequestService = class RequestService {
    requestRepository;
    constructor(requestRepository) {
        this.requestRepository = requestRepository;
    }
    async create(clientId, dto) {
        const request = request_entity_1.Request.create({
            clientId,
            title: dto.title,
            detailedDescription: dto.detailedDescription,
            category: dto.category,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            latitude: dto.latitude,
            longitude: dto.longitude,
            images: dto.images,
        });
        await this.requestRepository.create(request);
        const created = await this.requestRepository.findById(request.id);
        return request_dto_1.RequestDto.from(created);
    }
    async list() {
        const requests = await this.requestRepository.findAll();
        return requests.map(request_dto_1.RequestDto.from);
    }
    async findById(id) {
        const request = await this.requestRepository.findById(id);
        if (!request)
            throw new common_1.NotFoundException();
        return request_dto_1.RequestDto.from(request);
    }
    async findByClientId(clientId) {
        const requests = await this.requestRepository.findByClientId(clientId);
        return requests.map(request_dto_1.RequestDto.from);
    }
    async findByCategory(category) {
        const requests = await this.requestRepository.findByCategory(category);
        return requests.map(request_dto_1.RequestDto.from);
    }
    async findByCity(city) {
        const requests = await this.requestRepository.findByCity(city);
        return requests.map(request_dto_1.RequestDto.from);
    }
    async edit(id, clientId, dto) {
        const request = await this.requestRepository.findById(id);
        if (!request)
            throw new common_1.NotFoundException();
        if (request.clientId !== clientId) {
            throw new common_1.NotFoundException();
        }
        if (dto.title)
            request["_title"] = dto.title;
        if (dto.detailedDescription)
            request["_detailedDescription"] = dto.detailedDescription;
        if (dto.category)
            request["_category"] = dto.category;
        if (dto.address)
            request["_address"] = dto.address;
        if (dto.city)
            request["_city"] = dto.city;
        if (dto.state)
            request["_state"] = dto.state;
        if (dto.latitude !== undefined)
            request["_latitude"] = dto.latitude;
        if (dto.longitude !== undefined)
            request["_longitude"] = dto.longitude;
        if (dto.images)
            request["_images"] = dto.images;
        await this.requestRepository.update(request);
        const updated = await this.requestRepository.findById(id);
        return request_dto_1.RequestDto.from(updated);
    }
    async remove(id, clientId) {
        const request = await this.requestRepository.findById(id);
        if (!request)
            throw new common_1.NotFoundException();
        if (request.clientId !== clientId) {
            throw new common_1.NotFoundException();
        }
        await this.requestRepository.delete(id);
    }
};
exports.RequestService = RequestService;
exports.RequestService = RequestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(request_repository_interface_1.REQUEST_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], RequestService);
//# sourceMappingURL=request.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceDto = void 0;
class ServiceDto {
    id;
    providerId;
    title;
    description;
    category;
    price;
    status;
    address;
    city;
    state;
    createdAt;
    updatedAt;
    static from(service) {
        const dto = new ServiceDto();
        dto.id = service.id;
        dto.providerId = service.providerId;
        dto.title = service.title;
        dto.description = service.description;
        dto.category = service.category;
        dto.price = Number(service.price);
        dto.status = service.status;
        dto.address = service.address;
        dto.city = service.city;
        dto.state = service.state;
        dto.createdAt = service.createdAt;
        dto.updatedAt = service.updatedAt;
        return dto;
    }
}
exports.ServiceDto = ServiceDto;
//# sourceMappingURL=service.dto.js.map
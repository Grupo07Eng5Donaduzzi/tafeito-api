"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestDto = void 0;
class RequestDto {
    id;
    clientId;
    title;
    detailedDescription;
    category;
    status;
    address;
    city;
    state;
    latitude;
    longitude;
    images;
    createdAt;
    updatedAt;
    static from(request) {
        const dto = new RequestDto();
        dto.id = request.id;
        dto.clientId = request.clientId;
        dto.title = request.title;
        dto.detailedDescription = request.detailedDescription;
        dto.category = request.category;
        dto.status = request.status;
        dto.address = request.address;
        dto.city = request.city;
        dto.state = request.state;
        dto.latitude = request.latitude ? Number(request.latitude) : undefined;
        dto.longitude = request.longitude ? Number(request.longitude) : undefined;
        dto.images = request.images || [];
        dto.createdAt = request.createdAt;
        dto.updatedAt = request.updatedAt;
        return dto;
    }
}
exports.RequestDto = RequestDto;
//# sourceMappingURL=request.dto.js.map
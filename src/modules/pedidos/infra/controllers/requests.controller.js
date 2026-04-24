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
exports.RequestsController = void 0;
const request_service_1 = require("../../application/services/request.service");
const common_1 = require("@nestjs/common");
let RequestsController = class RequestsController {
    requestService;
    constructor(requestService) {
        this.requestService = requestService;
    }
    async findAll() {
        return this.requestService.list();
    }
    async findByClientId(clientId) {
        return this.requestService.findByClientId(clientId);
    }
    async findByCategory(category) {
        return this.requestService.findByCategory(category);
    }
    async findByCity(city) {
        return this.requestService.findByCity(city);
    }
    async findById(id) {
        return this.requestService.findById(id);
    }
    async create(body) {
        const clientId = body.clientId || "00000000-0000-0000-0000-000000000001";
        return this.requestService.create(clientId, body);
    }
    async update(id, body) {
        const clientId = body.clientId || "00000000-0000-0000-0000-000000000001";
        return this.requestService.edit(id, clientId, body);
    }
    async remove(id, body) {
        const clientId = body.clientId || "00000000-0000-0000-0000-000000000001";
        return this.requestService.remove(id, clientId);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("cliente/:clientId"),
    __param(0, (0, common_1.Param)("clientId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findByClientId", null);
__decorate([
    (0, common_1.Get)("categoria/:category"),
    __param(0, (0, common_1.Param)("category")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)("cidade"),
    __param(0, (0, common_1.Query)("cidade")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findByCity", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "remove", null);
exports.RequestsController = RequestsController = __decorate([
    (0, common_1.Controller)("pedidos"),
    __metadata("design:paramtypes", [request_service_1.RequestService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map
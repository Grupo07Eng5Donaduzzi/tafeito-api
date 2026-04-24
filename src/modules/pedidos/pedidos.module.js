"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosModule = void 0;
const request_service_1 = require("./application/services/request.service");
const request_repository_interface_1 = require("./domain/repositories/request-repository.interface");
const requests_controller_1 = require("./infra/controllers/requests.controller");
const drizzle_request_repository_1 = require("./infra/repositories/drizzle-request.repository");
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../shared/shared.module");
let PedidosModule = class PedidosModule {
};
exports.PedidosModule = PedidosModule;
exports.PedidosModule = PedidosModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [requests_controller_1.RequestsController],
        providers: [
            request_service_1.RequestService,
            drizzle_request_repository_1.DrizzleRequestRepository,
            {
                provide: request_repository_interface_1.REQUEST_REPOSITORY,
                useExisting: drizzle_request_repository_1.DrizzleRequestRepository,
            },
        ],
        exports: [request_service_1.RequestService],
    })
], PedidosModule);
//# sourceMappingURL=pedidos.module.js.map
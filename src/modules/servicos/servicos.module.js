"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicosModule = void 0;
const service_service_1 = require("./application/services/service.service");
const service_repository_interface_1 = require("./domain/repositories/service-repository.interface");
const services_controller_1 = require("./infra/controllers/services.controller");
const drizzle_service_repository_1 = require("./infra/repositories/drizzle-service.repository");
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../shared/shared.module");
let ServicosModule = class ServicosModule {
};
exports.ServicosModule = ServicosModule;
exports.ServicosModule = ServicosModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [services_controller_1.ServicesController],
        providers: [
            service_service_1.ServiceService,
            drizzle_service_repository_1.DrizzleServiceRepository,
            {
                provide: service_repository_interface_1.SERVICE_REPOSITORY,
                useExisting: drizzle_service_repository_1.DrizzleServiceRepository,
            },
        ],
        exports: [service_service_1.ServiceService],
    })
], ServicosModule);
//# sourceMappingURL=servicos.module.js.map
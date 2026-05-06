"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuariosModule = void 0;
const user_service_1 = require("./application/services/user.service");
const user_repository_interface_1 = require("./domain/repositories/user-repository.interface");
const users_controller_1 = require("./infra/controllers/users.controller");
const firebase_auth_service_1 = require("./infra/firebase/firebase-auth.service");
const drizzle_user_repository_1 = require("./infra/repositories/drizzle-user.repository");
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../shared/shared.module");
let UsuariosModule = class UsuariosModule {
};
exports.UsuariosModule = UsuariosModule;
exports.UsuariosModule = UsuariosModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [users_controller_1.UsersController],
        providers: [
            user_service_1.UserService,
            firebase_auth_service_1.FirebaseAuthService,
            drizzle_user_repository_1.DrizzleUserRepository,
            {
                provide: user_repository_interface_1.USER_REPOSITORY,
                useExisting: drizzle_user_repository_1.DrizzleUserRepository,
            },
        ],
        exports: [user_service_1.UserService, firebase_auth_service_1.FirebaseAuthService],
    })
], UsuariosModule);
//# sourceMappingURL=usuarios.module.js.map
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
exports.UserService = void 0;
const user_dto_1 = require("../dto/user.dto");
const user_entity_1 = require("../../domain/models/user.entity");
const user_repository_interface_1 = require("../../domain/repositories/user-repository.interface");
const firebase_auth_service_1 = require("../../infra/firebase/firebase-auth.service");
const common_1 = require("@nestjs/common");
let UserService = class UserService {
    userRepository;
    firebaseAuthService;
    constructor(userRepository, firebaseAuthService) {
        this.userRepository = userRepository;
        this.firebaseAuthService = firebaseAuthService;
    }
    async create(dto) {
        const existing = await this.userRepository.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException();
        }
        const firebaseUid = await this.firebaseAuthService.createUser(dto.email, dto.password);
        const user = user_entity_1.User.restore({
            firebaseUid,
            name: dto.name,
            email: dto.email,
            identification: dto.identification,
        });
        await this.userRepository.create(user);
        const created = await this.userRepository.findByFirebaseUid(firebaseUid);
        return user_dto_1.UserDto.from(created);
    }
    async edit(id, dto) {
        const user = await this.userRepository.findById(id);
        if (!user)
            throw new common_1.NotFoundException();
        if (dto.name !== undefined)
            user.withName(dto.name);
        if (dto.identification !== undefined)
            user.withIdentification(dto.identification);
        await this.userRepository.update(user);
        const updated = await this.userRepository.findById(id);
        return user_dto_1.UserDto.from(updated);
    }
    async remove(id) {
        const user = await this.userRepository.findById(id);
        if (!user)
            throw new common_1.NotFoundException();
        await this.firebaseAuthService.deleteUser(user.firebaseUid);
        await this.userRepository.delete(id);
    }
    async list() {
        const rows = await this.userRepository.findAll();
        return rows.map((row) => user_dto_1.UserDto.from(row));
    }
    async findById(id) {
        const user = await this.userRepository.findById(id);
        return user_dto_1.UserDto.from(user);
    }
    async findByFirebaseUid(firebaseUid) {
        const user = await this.userRepository.findByFirebaseUid(firebaseUid);
        return user_dto_1.UserDto.from(user);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, firebase_auth_service_1.FirebaseAuthService])
], UserService);
//# sourceMappingURL=user.service.js.map
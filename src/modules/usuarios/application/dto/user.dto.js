"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDto = void 0;
class UserDto {
    id;
    firebaseUid;
    name;
    email;
    identification;
    createdAt;
    updatedAt;
    constructor(id, firebaseUid, name, email, identification, createdAt, updatedAt) {
        this.id = id;
        this.firebaseUid = firebaseUid;
        this.name = name;
        this.email = email;
        this.identification = identification;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static from(user) {
        if (!user)
            return null;
        return new UserDto(user.id, user.firebaseUid, user.name, user.email, user.identification, user.createdAt, user.updatedAt);
    }
}
exports.UserDto = UserDto;
//# sourceMappingURL=user.dto.js.map
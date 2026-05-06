"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    _id;
    _firebaseUid;
    _name;
    _email;
    _identification;
    _createdAt;
    _updatedAt;
    constructor(id, createdAt, updatedAt) {
        this._id = id;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
    }
    get id() {
        return this._id;
    }
    get firebaseUid() {
        return this._firebaseUid;
    }
    get name() {
        return this._name;
    }
    get email() {
        return this._email;
    }
    get identification() {
        return this._identification;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    withFirebaseUid(firebaseUid) {
        this._firebaseUid = firebaseUid;
        return this;
    }
    withName(name) {
        this._name = name;
        return this;
    }
    withEmail(email) {
        this._email = email;
        return this;
    }
    withIdentification(identification) {
        this._identification = identification;
        return this;
    }
    static restore(props) {
        if (!props)
            return null;
        const user = new User(props.id, props.createdAt, props.updatedAt);
        user._firebaseUid = props.firebaseUid;
        user._name = props.name;
        user._email = props.email;
        user._identification = props.identification;
        return user;
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map
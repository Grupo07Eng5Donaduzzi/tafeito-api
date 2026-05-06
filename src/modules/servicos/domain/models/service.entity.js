"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = exports.ServiceStatus = exports.ServiceCategory = void 0;
var ServiceCategory;
(function (ServiceCategory) {
    ServiceCategory["CLEANING"] = "CLEANING";
    ServiceCategory["PLUMBING"] = "PLUMBING";
    ServiceCategory["ELECTRICITY"] = "ELECTRICITY";
    ServiceCategory["PAINTING"] = "PAINTING";
    ServiceCategory["CARPENTRY"] = "CARPENTRY";
    ServiceCategory["LANDSCAPING"] = "LANDSCAPING";
    ServiceCategory["MOVING"] = "MOVING";
    ServiceCategory["ASSEMBLY"] = "ASSEMBLY";
    ServiceCategory["OTHER"] = "OTHER";
})(ServiceCategory || (exports.ServiceCategory = ServiceCategory = {}));
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["AVAILABLE"] = "AVAILABLE";
    ServiceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ServiceStatus["COMPLETED"] = "COMPLETED";
    ServiceStatus["CANCELLED"] = "CANCELLED";
})(ServiceStatus || (exports.ServiceStatus = ServiceStatus = {}));
class Service {
    _id;
    _providerId;
    _title;
    _description;
    _category;
    _price;
    _status;
    _address;
    _city;
    _state;
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
    get providerId() {
        return this._providerId;
    }
    get title() {
        return this._title;
    }
    get description() {
        return this._description;
    }
    get category() {
        return this._category;
    }
    get price() {
        return this._price;
    }
    get status() {
        return this._status;
    }
    get address() {
        return this._address;
    }
    get city() {
        return this._city;
    }
    get state() {
        return this._state;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    static create(props) {
        const service = new Service();
        service._providerId = props.providerId;
        service._title = props.title;
        service._description = props.description;
        service._category = props.category;
        service._price = props.price;
        service._status = ServiceStatus.AVAILABLE;
        service._address = props.address;
        service._city = props.city;
        service._state = props.state;
        return service;
    }
    static restore(props) {
        const service = new Service(props.id, props.createdAt, props.updatedAt);
        service._providerId = props.providerId;
        service._title = props.title;
        service._description = props.description;
        service._category = props.category;
        service._price = props.price;
        service._status = props.status;
        service._address = props.address;
        service._city = props.city;
        service._state = props.state;
        return service;
    }
}
exports.Service = Service;
//# sourceMappingURL=service.entity.js.map
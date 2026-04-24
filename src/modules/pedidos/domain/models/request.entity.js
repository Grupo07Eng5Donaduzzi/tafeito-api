"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = exports.RequestStatus = exports.RequestCategory = void 0;
var RequestCategory;
(function (RequestCategory) {
    RequestCategory["CLEANING"] = "CLEANING";
    RequestCategory["PLUMBING"] = "PLUMBING";
    RequestCategory["ELECTRICITY"] = "ELECTRICITY";
    RequestCategory["PAINTING"] = "PAINTING";
    RequestCategory["CARPENTRY"] = "CARPENTRY";
    RequestCategory["LANDSCAPING"] = "LANDSCAPING";
    RequestCategory["MOVING"] = "MOVING";
    RequestCategory["ASSEMBLY"] = "ASSEMBLY";
    RequestCategory["OTHER"] = "OTHER";
})(RequestCategory || (exports.RequestCategory = RequestCategory = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["OPEN"] = "OPEN";
    RequestStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RequestStatus["COMPLETED"] = "COMPLETED";
    RequestStatus["CANCELLED"] = "CANCELLED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
class Request {
    _id;
    _clientId;
    _title;
    _detailedDescription;
    _category;
    _status;
    _address;
    _city;
    _state;
    _latitude;
    _longitude;
    _images;
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
    get clientId() {
        return this._clientId;
    }
    get title() {
        return this._title;
    }
    get detailedDescription() {
        return this._detailedDescription;
    }
    get category() {
        return this._category;
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
    get latitude() {
        return this._latitude;
    }
    get longitude() {
        return this._longitude;
    }
    get images() {
        return this._images;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    static create(props) {
        const request = new Request();
        request._clientId = props.clientId;
        request._title = props.title;
        request._detailedDescription = props.detailedDescription;
        request._category = props.category;
        request._status = RequestStatus.OPEN;
        request._address = props.address;
        request._city = props.city;
        request._state = props.state;
        request._latitude = props.latitude;
        request._longitude = props.longitude;
        request._images = props.images || [];
        return request;
    }
    static restore(props) {
        const request = new Request(props.id, props.createdAt, props.updatedAt);
        request._clientId = props.clientId;
        request._title = props.title;
        request._detailedDescription = props.detailedDescription;
        request._category = props.category;
        request._status = props.status;
        request._address = props.address;
        request._city = props.city;
        request._state = props.state;
        request._latitude = props.latitude;
        request._longitude = props.longitude;
        request._images = props.images;
        return request;
    }
}
exports.Request = Request;
//# sourceMappingURL=request.entity.js.map
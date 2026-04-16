export enum RequestCategory {
  CLEANING = "CLEANING",
  PLUMBING = "PLUMBING",
  ELECTRICITY = "ELECTRICITY",
  PAINTING = "PAINTING",
  CARPENTRY = "CARPENTRY",
  LANDSCAPING = "LANDSCAPING",
  MOVING = "MOVING",
  ASSEMBLY = "ASSEMBLY",
  OTHER = "OTHER",
}

export enum RequestStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class Request {
  private readonly _id?: string;
  private _clientId: string;
  private _title: string;
  private _detailedDescription: string;
  private _category: RequestCategory;
  private _status: RequestStatus;
  private _address: string;
  private _city: string;
  private _state: string;
  private _latitude?: number;
  private _longitude?: number;
  private _images: string[];
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get clientId(): string {
    return this._clientId;
  }

  get title(): string {
    return this._title;
  }

  get detailedDescription(): string {
    return this._detailedDescription;
  }

  get category(): RequestCategory {
    return this._category;
  }

  get status(): RequestStatus {
    return this._status;
  }

  get address(): string {
    return this._address;
  }

  get city(): string {
    return this._city;
  }

  get state(): string {
    return this._state;
  }

  get latitude(): number | undefined {
    return this._latitude;
  }

  get longitude(): number | undefined {
    return this._longitude;
  }

  get images(): string[] {
    return this._images;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  static create(props: {
    clientId: string;
    title: string;
    detailedDescription: string;
    category: RequestCategory;
    address: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
    images?: string[];
  }): Request {
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

  static restore(props: {
    id: string;
    clientId: string;
    title: string;
    detailedDescription: string;
    category: RequestCategory;
    status: RequestStatus;
    address: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Request {
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
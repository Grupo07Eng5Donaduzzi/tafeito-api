export enum ServiceCategory {
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

export enum ServiceStatus {
  AVAILABLE = "AVAILABLE",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class Service {
  private readonly _id?: string;
  private _providerId: string;
  private _title: string;
  private _description: string;
  private _category: ServiceCategory;
  private _price: number;
  private _status: ServiceStatus;
  private _address: string;
  private _city: string;
  private _state: string;
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

  get providerId(): string {
    return this._providerId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get category(): ServiceCategory {
    return this._category;
  }

  get price(): number {
    return this._price;
  }

  get status(): ServiceStatus {
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

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  static create(props: {
    providerId: string;
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    address: string;
    city: string;
    state: string;
  }): Service {
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

  static restore(props: {
    id: string;
    providerId: string;
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    status: ServiceStatus;
    address: string;
    city: string;
    state: string;
    createdAt: Date;
    updatedAt: Date;
  }): Service {
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
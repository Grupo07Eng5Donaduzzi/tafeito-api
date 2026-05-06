export declare enum ServiceCategory {
    CLEANING = "CLEANING",
    PLUMBING = "PLUMBING",
    ELECTRICITY = "ELECTRICITY",
    PAINTING = "PAINTING",
    CARPENTRY = "CARPENTRY",
    LANDSCAPING = "LANDSCAPING",
    MOVING = "MOVING",
    ASSEMBLY = "ASSEMBLY",
    OTHER = "OTHER"
}
export declare enum ServiceStatus {
    AVAILABLE = "AVAILABLE",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class Service {
    private readonly _id?;
    private _providerId;
    private _title;
    private _description;
    private _category;
    private _price;
    private _status;
    private _address;
    private _city;
    private _state;
    private readonly _createdAt?;
    private readonly _updatedAt?;
    private constructor();
    get id(): string | undefined;
    get providerId(): string;
    get title(): string;
    get description(): string;
    get category(): ServiceCategory;
    get price(): number;
    get status(): ServiceStatus;
    get address(): string;
    get city(): string;
    get state(): string;
    get createdAt(): Date | undefined;
    get updatedAt(): Date | undefined;
    static create(props: {
        providerId: string;
        title: string;
        description: string;
        category: ServiceCategory;
        price: number;
        address: string;
        city: string;
        state: string;
    }): Service;
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
    }): Service;
}

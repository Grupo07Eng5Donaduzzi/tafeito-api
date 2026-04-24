export declare enum RequestCategory {
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
export declare enum RequestStatus {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class Request {
    private readonly _id?;
    private _clientId;
    private _title;
    private _detailedDescription;
    private _category;
    private _status;
    private _address;
    private _city;
    private _state;
    private _latitude?;
    private _longitude?;
    private _images;
    private readonly _createdAt?;
    private readonly _updatedAt?;
    private constructor();
    get id(): string | undefined;
    get clientId(): string;
    get title(): string;
    get detailedDescription(): string;
    get category(): RequestCategory;
    get status(): RequestStatus;
    get address(): string;
    get city(): string;
    get state(): string;
    get latitude(): number | undefined;
    get longitude(): number | undefined;
    get images(): string[];
    get createdAt(): Date | undefined;
    get updatedAt(): Date | undefined;
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
    }): Request;
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
    }): Request;
}

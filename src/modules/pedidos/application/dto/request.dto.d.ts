import { RequestCategory, RequestStatus } from "../../domain/models/request.entity";
export declare class RequestDto {
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
    static from(request: any): RequestDto;
}

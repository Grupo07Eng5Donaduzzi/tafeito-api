import { RequestCategory } from "../../domain/models/request.entity";
export declare class CreateRequestDto {
    title: string;
    detailedDescription: string;
    category: RequestCategory;
    address: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
    images?: string[];
}
export declare class UpdateRequestDto {
    title?: string;
    detailedDescription?: string;
    category?: RequestCategory;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    images?: string[];
}

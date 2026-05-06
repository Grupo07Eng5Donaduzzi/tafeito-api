import { ServiceCategory } from "../../domain/models/service.entity";
export declare class CreateServiceDto {
    title: string;
    description: string;
    category: ServiceCategory;
    price: number;
    address: string;
    city: string;
    state: string;
}
export declare class UpdateServiceDto {
    title?: string;
    description?: string;
    category?: ServiceCategory;
    price?: number;
    address?: string;
    city?: string;
    state?: string;
}

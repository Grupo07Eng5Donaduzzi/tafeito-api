import { ServiceCategory, ServiceStatus } from "../../domain/models/service.entity";
export declare class ServiceDto {
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
    static from(service: any): ServiceDto;
}

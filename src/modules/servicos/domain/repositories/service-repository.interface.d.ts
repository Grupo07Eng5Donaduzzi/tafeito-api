import type { Service } from "../models/service.entity";
export declare const SERVICE_REPOSITORY: unique symbol;
export interface ServiceRepository {
    create(service: Service): Promise<void>;
    update(service: Service): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(): Promise<Service[]>;
    findById(id: string): Promise<Service | null>;
    findByProviderId(providerId: string): Promise<Service[]>;
}

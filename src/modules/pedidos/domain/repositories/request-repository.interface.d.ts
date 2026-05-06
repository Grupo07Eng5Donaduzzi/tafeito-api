import type { Request } from "../models/request.entity";
export declare const REQUEST_REPOSITORY: unique symbol;
export interface RequestRepository {
    create(request: Request): Promise<void>;
    update(request: Request): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(): Promise<Request[]>;
    findById(id: string): Promise<Request | null>;
    findByClientId(clientId: string): Promise<Request[]>;
    findByCategory(category: string): Promise<Request[]>;
    findByCity(city: string): Promise<Request[]>;
}

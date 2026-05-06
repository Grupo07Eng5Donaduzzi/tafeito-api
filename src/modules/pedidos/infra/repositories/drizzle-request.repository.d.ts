import { Request } from "../../domain/models/request.entity";
import type { RequestRepository } from "../../domain/repositories/request-repository.interface";
import { DrizzleService } from "../../../../shared/infra/database/drizzle.service";
export declare class DrizzleRequestRepository implements RequestRepository {
    private readonly drizzleService;
    constructor(drizzleService: DrizzleService);
    create(request: Request): Promise<void>;
    update(request: Request): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(): Promise<Request[]>;
    findById(id: string): Promise<Request | null>;
    findByClientId(clientId: string): Promise<Request[]>;
    findByCategory(category: string): Promise<Request[]>;
    findByCity(city: string): Promise<Request[]>;
    private mapToEntity;
}

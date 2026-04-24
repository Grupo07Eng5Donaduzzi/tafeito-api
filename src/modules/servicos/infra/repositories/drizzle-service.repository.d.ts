import { Service } from "../../domain/models/service.entity";
import type { ServiceRepository } from "../../domain/repositories/service-repository.interface";
import { DrizzleService } from "../../../../shared/infra/database/drizzle.service";
export declare class DrizzleServiceRepository implements ServiceRepository {
    private readonly drizzleService;
    constructor(drizzleService: DrizzleService);
    create(service: Service): Promise<void>;
    update(service: Service): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(): Promise<Service[]>;
    findById(id: string): Promise<Service | null>;
    findByProviderId(providerId: string): Promise<Service[]>;
    private mapToEntity;
}

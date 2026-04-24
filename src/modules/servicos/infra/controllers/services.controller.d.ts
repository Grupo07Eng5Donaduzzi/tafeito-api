import { CreateServiceDto, UpdateServiceDto } from "../../application/dto/create-service.dto";
import { ServiceService } from "../../application/services/service.service";
export declare class ServicesController {
    private readonly serviceService;
    constructor(serviceService: ServiceService);
    findAll(): Promise<import("../../application/dto/service.dto").ServiceDto[]>;
    findByProviderId(providerId: string): Promise<import("../../application/dto/service.dto").ServiceDto[]>;
    findById(id: string): Promise<import("../../application/dto/service.dto").ServiceDto>;
    create(body: CreateServiceDto): Promise<import("../../application/dto/service.dto").ServiceDto>;
    update(id: string, body: UpdateServiceDto & {
        providerId?: string;
    }): Promise<import("../../application/dto/service.dto").ServiceDto>;
    remove(id: string, body: {
        providerId?: string;
    }): Promise<void>;
}

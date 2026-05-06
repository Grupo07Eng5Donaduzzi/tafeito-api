import { CreateServiceDto, UpdateServiceDto } from "../dto/create-service.dto";
import { ServiceDto } from "../dto/service.dto";
import { type ServiceRepository } from "../../domain/repositories/service-repository.interface";
export declare class ServiceService {
    private readonly serviceRepository;
    constructor(serviceRepository: ServiceRepository);
    create(providerId: string, dto: CreateServiceDto): Promise<ServiceDto>;
    list(): Promise<ServiceDto[]>;
    findById(id: string): Promise<ServiceDto>;
    findByProviderId(providerId: string): Promise<ServiceDto[]>;
    edit(id: string, providerId: string, dto: UpdateServiceDto): Promise<ServiceDto>;
    remove(id: string, providerId: string): Promise<void>;
}

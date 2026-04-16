import { CreateServiceDto, UpdateServiceDto } from "@servicos/application/dto/create-service.dto";
import { ServiceDto } from "@servicos/application/dto/service.dto";
import { Service } from "@servicos/domain/models/service.entity";
import {
  SERVICE_REPOSITORY,
  type ServiceRepository,
} from "@servicos/domain/repositories/service-repository.interface";
import {
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class ServiceService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: ServiceRepository,
  ) { }

  async create(providerId: string, dto: CreateServiceDto): Promise<ServiceDto> {
    const service = Service.create({
      providerId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      price: dto.price,
      address: dto.address,
      city: dto.city,
      state: dto.state,
    });

    await this.serviceRepository.create(service!);

    const created = await this.serviceRepository.findById(service.id!);
    return ServiceDto.from(created!);
  }

  async list(): Promise<ServiceDto[]> {
    const services = await this.serviceRepository.findAll();
    return services.map(ServiceDto.from);
  }

  async findById(id: string): Promise<ServiceDto> {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException();
    return ServiceDto.from(service);
  }

  async findByProviderId(providerId: string): Promise<ServiceDto[]> {
    const services = await this.serviceRepository.findByProviderId(providerId);
    return services.map(ServiceDto.from);
  }

  async edit(id: string, providerId: string, dto: UpdateServiceDto): Promise<ServiceDto> {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException();
    
    // Verificar se o prestador é o dono do serviço
    if (service.providerId !== providerId) {
      throw new NotFoundException();
    }

    // Atualizar campos
    if (dto.title) service["_title"] = dto.title;
    if (dto.description) service["_description"] = dto.description;
    if (dto.category) service["_category"] = dto.category;
    if (dto.price) service["_price"] = dto.price;
    if (dto.address) service["_address"] = dto.address;
    if (dto.city) service["_city"] = dto.city;
    if (dto.state) service["_state"] = dto.state;

    await this.serviceRepository.update(service);

    const updated = await this.serviceRepository.findById(id);
    return ServiceDto.from(updated!);
  }

  async remove(id: string, providerId: string): Promise<void> {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException();
    
    // Verificar se o prestador é o dono do serviço
    if (service.providerId !== providerId) {
      throw new NotFoundException();
    }

    await this.serviceRepository.delete(id);
  }
}
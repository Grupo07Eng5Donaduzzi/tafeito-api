import { CreateRequestDto, UpdateRequestDto } from "@pedidos/application/dto/create-request.dto";
import { RequestDto } from "@pedidos/application/dto/request.dto";
import { Request } from "@pedidos/domain/models/request.entity";
import {
  REQUEST_REPOSITORY,
  type RequestRepository,
} from "@pedidos/domain/repositories/request-repository.interface";
import {
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class RequestService {
  constructor(
    @Inject(REQUEST_REPOSITORY)
    private readonly requestRepository: RequestRepository,
  ) { }

  async create(clientId: string, dto: CreateRequestDto): Promise<RequestDto> {
    const request = Request.create({
      clientId,
      title: dto.title,
      detailedDescription: dto.detailedDescription,
      category: dto.category,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      latitude: dto.latitude,
      longitude: dto.longitude,
      images: dto.images,
    });

    await this.requestRepository.create(request!);

    const created = await this.requestRepository.findById(request.id!);
    return RequestDto.from(created!);
  }

  async list(): Promise<RequestDto[]> {
    const requests = await this.requestRepository.findAll();
    return requests.map(RequestDto.from);
  }

  async findById(id: string): Promise<RequestDto> {
    const request = await this.requestRepository.findById(id);
    if (!request) throw new NotFoundException();
    return RequestDto.from(request);
  }

  async findByClientId(clientId: string): Promise<RequestDto[]> {
    const requests = await this.requestRepository.findByClientId(clientId);
    return requests.map(RequestDto.from);
  }

  async findByCategory(category: string): Promise<RequestDto[]> {
    const requests = await this.requestRepository.findByCategory(category);
    return requests.map(RequestDto.from);
  }

  async findByCity(city: string): Promise<RequestDto[]> {
    const requests = await this.requestRepository.findByCity(city);
    return requests.map(RequestDto.from);
  }

  async edit(id: string, clientId: string, dto: UpdateRequestDto): Promise<RequestDto> {
    const request = await this.requestRepository.findById(id);
    if (!request) throw new NotFoundException();
    
    if (request.clientId !== clientId) {
      throw new NotFoundException();
    }

    if (dto.title) request["_title"] = dto.title;
    if (dto.detailedDescription) request["_detailedDescription"] = dto.detailedDescription;
    if (dto.category) request["_category"] = dto.category;
    if (dto.address) request["_address"] = dto.address;
    if (dto.city) request["_city"] = dto.city;
    if (dto.state) request["_state"] = dto.state;
    if (dto.latitude !== undefined) request["_latitude"] = dto.latitude;
    if (dto.longitude !== undefined) request["_longitude"] = dto.longitude;
    if (dto.images) request["_images"] = dto.images;

    await this.requestRepository.update(request);

    const updated = await this.requestRepository.findById(id);
    return RequestDto.from(updated!);
  }

  async remove(id: string, clientId: string): Promise<void> {
    const request = await this.requestRepository.findById(id);
    if (!request) throw new NotFoundException();
    
    if (request.clientId !== clientId) {
      throw new NotFoundException();
    }

    await this.requestRepository.delete(id);
  }
}
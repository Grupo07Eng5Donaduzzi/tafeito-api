import { ServiceCategory, ServiceStatus } from "@servicos/domain/models/service.entity";

export class ServiceDto {
  id!: string;
  providerId!: string;
  title!: string;
  description!: string;
  category!: ServiceCategory;
  price!: number;
  status!: ServiceStatus;
  address!: string;
  city!: string;
  state!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static from(service: any): ServiceDto {
    const dto = new ServiceDto();
    dto.id = service.id;
    dto.providerId = service.providerId;
    dto.title = service.title;
    dto.description = service.description;
    dto.category = service.category;
    dto.price = Number(service.price);
    dto.status = service.status;
    dto.address = service.address;
    dto.city = service.city;
    dto.state = service.state;
    dto.createdAt = service.createdAt;
    dto.updatedAt = service.updatedAt;
    return dto;
  }
}
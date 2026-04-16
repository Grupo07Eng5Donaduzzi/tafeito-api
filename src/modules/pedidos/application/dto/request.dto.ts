import { RequestCategory, RequestStatus } from "@pedidos/domain/models/request.entity";

export class RequestDto {
  id!: string;
  clientId!: string;
  title!: string;
  detailedDescription!: string;
  category!: RequestCategory;
  status!: RequestStatus;
  address!: string;
  city!: string;
  state!: string;
  latitude?: number;
  longitude?: number;
  images!: string[];
  createdAt!: Date;
  updatedAt!: Date;

  static from(request: any): RequestDto {
    const dto = new RequestDto();
    dto.id = request.id;
    dto.clientId = request.clientId;
    dto.title = request.title;
    dto.detailedDescription = request.detailedDescription;
    dto.category = request.category;
    dto.status = request.status;
    dto.address = request.address;
    dto.city = request.city;
    dto.state = request.state;
    dto.latitude = request.latitude ? Number(request.latitude) : undefined;
    dto.longitude = request.longitude ? Number(request.longitude) : undefined;
    dto.images = request.images || [];
    dto.createdAt = request.createdAt;
    dto.updatedAt = request.updatedAt;
    return dto;
  }
}
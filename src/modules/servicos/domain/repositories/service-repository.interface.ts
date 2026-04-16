import type { Service } from "@servicos/domain/models/service.entity";

export const SERVICE_REPOSITORY = Symbol("SERVICE_REPOSITORY");

export interface ServiceRepository {
  create(service: Service): Promise<void>;
  update(service: Service): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Service[]>;
  findById(id: string): Promise<Service | null>;
  findByProviderId(providerId: string): Promise<Service[]>;
}
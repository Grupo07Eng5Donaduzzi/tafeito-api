import { Service } from "@servicos/domain/models/service.entity";
import type { ServiceRepository } from "@servicos/domain/repositories/service-repository.interface";
import { servicesSchema } from "@servicos/infra/schemas/service.schema";
import { Injectable } from "@nestjs/common";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { eq } from "drizzle-orm";

@Injectable()
export class DrizzleServiceRepository implements ServiceRepository {
  constructor(private readonly drizzleService: DrizzleService) { }

  async create(service: Service): Promise<void> {
    await this.drizzleService.db.insert(servicesSchema).values({
      providerId: service.providerId,
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price.toString(),
      status: service.status,
      address: service.address,
      city: service.city,
      state: service.state,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(service: Service): Promise<void> {
    await this.drizzleService.db
      .update(servicesSchema)
      .set({
        title: service.title,
        description: service.description,
        category: service.category,
        price: service.price.toString(),
        address: service.address,
        city: service.city,
        state: service.state,
        updatedAt: new Date(),
      })
      .where(eq(servicesSchema.id, service.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(servicesSchema)
      .where(eq(servicesSchema.id, id));
  }

  async findAll(): Promise<Service[]> {
    const result = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .orderBy(servicesSchema.createdAt);
    return result.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Service | null> {
    const result = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .where(eq(servicesSchema.id, id))
      .limit(1);
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByProviderId(providerId: string): Promise<Service[]> {
    const result = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .where(eq(servicesSchema.providerId, providerId))
      .orderBy(servicesSchema.createdAt);
    return result.map(this.mapToEntity);
  }

  private mapToEntity(row: any): Service {
    return Service.restore({
      id: row.id,
      providerId: row.providerId,
      title: row.title,
      description: row.description,
      category: row.category,
      price: Number(row.price),
      status: row.status,
      address: row.address,
      city: row.city,
      state: row.state,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
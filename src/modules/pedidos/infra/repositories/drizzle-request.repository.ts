import { Request } from "@pedidos/domain/models/request.entity";
import type { RequestRepository } from "@pedidos/domain/repositories/request-repository.interface";
import { requestsSchema } from "@pedidos/infra/schemas/request.schema";
import { Injectable } from "@nestjs/common";
import { DrizzleService } from "@shared/infra/database/drizzle.service";
import { eq, ilike, and } from "drizzle-orm";

@Injectable()
export class DrizzleRequestRepository implements RequestRepository {
  constructor(private readonly drizzleService: DrizzleService) { }

  async create(request: Request): Promise<void> {
    await this.drizzleService.db.insert(requestsSchema).values({
      clientId: request.clientId,
      title: request.title,
      detailedDescription: request.detailedDescription,
      category: request.category,
      status: request.status,
      address: request.address,
      city: request.city,
      state: request.state,
      latitude: request.latitude?.toString(),
      longitude: request.longitude?.toString(),
      images: request.images,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(request: Request): Promise<void> {
    await this.drizzleService.db
      .update(requestsSchema)
      .set({
        title: request.title,
        detailedDescription: request.detailedDescription,
        category: request.category,
        address: request.address,
        city: request.city,
        state: request.state,
        latitude: request.latitude?.toString(),
        longitude: request.longitude?.toString(),
        images: request.images,
        updatedAt: new Date(),
      })
      .where(eq(requestsSchema.id, request.id!));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(requestsSchema)
      .where(eq(requestsSchema.id, id));
  }

  async findAll(): Promise<Request[]> {
    const result = await this.drizzleService.db
      .select()
      .from(requestsSchema)
      .orderBy(requestsSchema.createdAt);
    return result.map(this.mapToEntity);
  }

  async findById(id: string): Promise<Request | null> {
    const result = await this.drizzleService.db
      .select()
      .from(requestsSchema)
      .where(eq(requestsSchema.id, id))
      .limit(1);
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByClientId(clientId: string): Promise<Request[]> {
    const result = await this.drizzleService.db
      .select()
      .from(requestsSchema)
      .where(eq(requestsSchema.clientId, clientId))
      .orderBy(requestsSchema.createdAt);
    return result.map(this.mapToEntity);
  }

  async findByCategory(category: string): Promise<Request[]> {
    const result = await this.drizzleService.db
      .select()
      .from(requestsSchema)
      .where(eq(requestsSchema.category, category as any))
      .orderBy(requestsSchema.createdAt);
    return result.map(this.mapToEntity);
  }

  async findByCity(city: string): Promise<Request[]> {
    const result = await this.drizzleService.db
      .select()
      .from(requestsSchema)
      .where(ilike(requestsSchema.city, `%${city}%`))
      .orderBy(requestsSchema.createdAt);
    return result.map(this.mapToEntity);
  }

  private mapToEntity(row: any): Request {
    return Request.restore({
      id: row.id,
      clientId: row.clientId,
      title: row.title,
      detailedDescription: row.detailedDescription,
      category: row.category,
      status: row.status,
      address: row.address,
      city: row.city,
      state: row.state,
      latitude: row.latitude ? Number(row.latitude) : undefined,
      longitude: row.longitude ? Number(row.longitude) : undefined,
      images: row.images || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { servicesSchema } from '../schemas/service.schema';
import { eq, sql } from 'drizzle-orm';
import { CreateServiceDto } from '../../application/dto/create-service.dto';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';

@Injectable()
export class DrizzleServiceRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(): Promise<any[]> {
    return await this.drizzleService.db
      .select()
      .from(servicesSchema);
  }

  async findByCategory(category: string): Promise<any[]> {
    return await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .where(eq(servicesSchema.category, category));
  }

  async findById(id: string): Promise<any | null> {
    const result = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .where(eq(servicesSchema.id, id));

    return result[0] ?? null;
  }

  async deleteById(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(servicesSchema)
      .where(eq(servicesSchema.id, id));
  }

  async create(dto: CreateServiceDto): Promise<any> {
    const id = randomUUID();
    await this.drizzleService.db.execute(
      sql`INSERT INTO services (id, user_id, name, description, category, price, duration, created_at, updated_at)
          VALUES (${id}::uuid, ${dto.userId}::uuid, ${dto.name}, ${dto.description}, ${dto.category}, ${dto.price}::numeric, ${dto.duration}::numeric, NOW(), NOW())`,
    );
    return this.findById(id);
  }

  async updateById(id: string, dto: UpdateServiceDto): Promise<void> {
    await this.drizzleService.db
      .update(servicesSchema)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(servicesSchema.id, id));
  }
}
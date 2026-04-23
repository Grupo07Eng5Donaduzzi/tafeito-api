import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { servicesSchema } from '../schemas/service.schema';
import { eq } from 'drizzle-orm';

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
}
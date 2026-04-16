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
}

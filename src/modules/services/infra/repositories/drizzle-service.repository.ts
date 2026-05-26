import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { servicesSchema } from '../schemas/service.schema';
import { count, eq } from 'drizzle-orm';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';

@Injectable()
export class DrizzleServiceRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(
    page: number,
    pageSize: number,
  ): Promise<{ data: any[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(servicesSchema);

    const data = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data, total: Number(total) };
  }

  async findByCategory(
    category: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: any[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(servicesSchema)
      .where(eq(servicesSchema.category, category));

    const data = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .where(eq(servicesSchema.category, category))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data, total: Number(total) };
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

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { servicesSchema } from '../schemas/service.schema';
import { eq, sql } from 'drizzle-orm';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';

@Injectable()
export class DrizzleServiceRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(data: {
    userId: string;
    name: string;
    description: string;
    category: string;
    price: string;
    duration: string;
  }): Promise<any> {
    const [inserted] = await this.drizzleService.db
      .insert(servicesSchema)
      .values({
        userId: data.userId,
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        duration: data.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return inserted;
  }

  async findAll(): Promise<any[]> {
    return this.drizzleService.db.select().from(servicesSchema);
  }

  async findAllPaginated(params: {
    limit: number;
    offset: number;
    category?: string;
  }): Promise<{ data: any[]; total: number }> {
    const { limit, offset, category } = params;
    const where = category ? eq(servicesSchema.category, category) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.drizzleService.db
        .select()
        .from(servicesSchema)
        .where(where)
        .limit(limit)
        .offset(offset),
      this.drizzleService.db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(servicesSchema)
        .where(where),
    ]);

    return { data, total };
  }

  async findByCategory(category: string): Promise<any[]> {
    return this.drizzleService.db
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

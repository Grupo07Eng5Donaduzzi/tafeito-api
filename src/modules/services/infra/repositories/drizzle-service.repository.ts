import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { servicesSchema } from '../schemas/service.schema';
import { eq } from 'drizzle-orm';
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

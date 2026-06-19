import { Injectable } from '@nestjs/common';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { servicesSchema } from '../schemas/service.schema';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { reviewsSchema } from '@reviews/infra/schemas/review.schema';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';
import { PricingType } from '../../application/dto/create-service.dto';

const serviceWithProviderSelect = {
  id: servicesSchema.id,
  userId: servicesSchema.userId,
  name: servicesSchema.name,
  description: servicesSchema.description,
  category: servicesSchema.category,
  price: servicesSchema.price,
  pricingType: servicesSchema.pricingType,
  photo: servicesSchema.photo,
  createdAt: servicesSchema.createdAt,
  updatedAt: servicesSchema.updatedAt,
  provider: { id: usersSchema.id, name: usersSchema.name },
};

@Injectable()
export class DrizzleServiceRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(data: {
    userId: string;
    name: string;
    description: string;
    category: string;
    price: string;
    pricingType: PricingType;
  }): Promise<any> {
    const [inserted] = await this.drizzleService.db
      .insert(servicesSchema)
      .values({
        userId: data.userId,
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        pricingType: data.pricingType,
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
        .select(serviceWithProviderSelect)
        .from(servicesSchema)
        .leftJoin(usersSchema, eq(servicesSchema.userId, usersSchema.id))
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

  async findByUserId(userId: string): Promise<any[]> {
    return this.drizzleService.db
      .select(serviceWithProviderSelect)
      .from(servicesSchema)
      .leftJoin(usersSchema, eq(servicesSchema.userId, usersSchema.id))
      .where(eq(servicesSchema.userId, userId));
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

  async findByIdWithDetails(id: string): Promise<any | null> {
    const service = await this.findById(id);
    if (!service) return null;

    const [provider] = await this.drizzleService.db
      .select({ id: usersSchema.id, name: usersSchema.name })
      .from(usersSchema)
      .where(eq(usersSchema.id, service.userId))
      .limit(1);

    const [recentReviews, [summary]] = await Promise.all([
      this.drizzleService.db
        .select({
          id: reviewsSchema.id,
          rating: reviewsSchema.rating,
          comment: reviewsSchema.comment,
          createdAt: reviewsSchema.createdAt,
          reviewerId: reviewsSchema.reviewerId,
        })
        .from(reviewsSchema)
        .where(eq(reviewsSchema.serviceId, service.id))
        .orderBy(desc(reviewsSchema.createdAt))
        .limit(5),
      this.drizzleService.db
        .select({
          total: sql<number>`cast(count(*) as int)`,
          average: sql<number>`round(avg(${reviewsSchema.rating})::numeric, 1)`,
        })
        .from(reviewsSchema)
        .where(eq(reviewsSchema.serviceId, service.id)),
    ]);

    return {
      ...service,
      provider: provider ?? null,
      reviews: {
        data: recentReviews,
        total: summary?.total ?? 0,
        average: summary?.average ?? null,
      },
    };
  }

  async findDistinctCategories(): Promise<string[]> {
    const rows = await this.drizzleService.db
      .selectDistinct({ category: servicesSchema.category })
      .from(servicesSchema)
      .orderBy(asc(servicesSchema.category));
    return rows.map((r) => r.category);
  }

  async deleteById(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(servicesSchema)
      .where(eq(servicesSchema.id, id));
  }

  async updateById(id: string, dto: Partial<UpdateServiceDto> & { photo?: string }): Promise<void> {
    const payload: Record<string, any> = { updatedAt: new Date() };
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.category !== undefined) payload.category = dto.category;
    if (dto.price !== undefined) payload.price = dto.price;
    if (dto.pricingType !== undefined) payload.pricingType = dto.pricingType;
    if (dto.userId !== undefined) payload.userId = dto.userId;
    if (dto.photo !== undefined) payload.photo = dto.photo;

    await this.drizzleService.db
      .update(servicesSchema)
      .set(payload)
      .where(eq(servicesSchema.id, id));
  }
}

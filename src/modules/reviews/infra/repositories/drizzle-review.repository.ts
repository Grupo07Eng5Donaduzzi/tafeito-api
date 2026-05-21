// src/modules/reviews/infra/repositories/drizzle-review.repository.ts
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import { Review } from '../../domain/models/review.entity';
import type { ReviewRepository } from '../../domain/repositories/review-repository.interface';
import { reviewsSchema } from '../schemas/review.schema';

@Injectable()
export class DrizzleReviewRepository implements ReviewRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(review: Review): Promise<void> {
    await this.drizzleService.db.insert(reviewsSchema).values({
      proposalId: review.proposalId,
      reviewerId: review.reviewerId,
      reviewedId: review.reviewedId,
      rating: review.rating,
      comment: review.comment ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(review: Review): Promise<void> {
    if (!review.id) throw new Error('Cannot update a Review without an id');
    await this.drizzleService.db
      .update(reviewsSchema)
      .set({
        rating: review.rating,
        comment: review.comment ?? null,
        updatedAt: new Date(),
      })
      .where(eq(reviewsSchema.id, review.id));
  }

  async findById(id: string): Promise<Review | null> {
    const result = await this.drizzleService.db
      .select()
      .from(reviewsSchema)
      .where(eq(reviewsSchema.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByProposalId(proposalId: string): Promise<Review | null> {
    const result = await this.drizzleService.db
      .select()
      .from(reviewsSchema)
      .where(eq(reviewsSchema.proposalId, proposalId))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByReviewedId(reviewedId: string): Promise<Review[]> {
    const result = await this.drizzleService.db
      .select()
      .from(reviewsSchema)
      .where(eq(reviewsSchema.reviewedId, reviewedId))
      .orderBy(reviewsSchema.createdAt);

    return result.map((row) => this.mapToEntity(row));
  }

  private mapToEntity(row: typeof reviewsSchema.$inferSelect): Review {
    return Review.restore({
      id: row.id,
      proposalId: row.proposalId,
      reviewerId: row.reviewerId,
      reviewedId: row.reviewedId,
      rating: row.rating,
      comment: row.comment ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

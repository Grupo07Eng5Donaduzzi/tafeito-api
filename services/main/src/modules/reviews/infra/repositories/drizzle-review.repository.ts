import { Injectable } from '@nestjs/common';
import { count, desc, eq, sql } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { Review } from '../../domain/models/review.entity';
import type {
  FindReviewedPage,
  RatingSummary,
  ReviewRepository,
} from '../../domain/repositories/review-repository.interface';
import { reviewsSchema } from '../schemas/review.schema';

export class UniqueReviewViolation extends Error {
  constructor() {
    super('Review already exists for this proposal');
    this.name = 'UniqueReviewViolation';
  }
}

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

@Injectable()
export class DrizzleReviewRepository implements ReviewRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(review: Review): Promise<Review> {
    try {
      const [row] = await this.drizzleService.db
        .insert(reviewsSchema)
        .values({
          proposalId: review.proposalId,
          reviewerId: review.reviewerId,
          reviewedId: review.reviewedId,
          rating: review.rating,
          comment: review.comment ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return this.mapToEntity(row);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new UniqueReviewViolation();
      }
      throw err;
    }
  }

  async update(review: Review): Promise<Review> {
    if (!review.id) throw new Error('Cannot update a Review without an id');
    const [row] = await this.drizzleService.db
      .update(reviewsSchema)
      .set({
        rating: review.rating,
        comment: review.comment ?? null,
        updatedAt: new Date(),
      })
      .where(eq(reviewsSchema.id, review.id))
      .returning();
    return this.mapToEntity(row);
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

  async findByReviewedId(
    reviewedId: string,
    options: { limit: number; offset: number },
  ): Promise<FindReviewedPage> {
    const [rows, totalRow] = await Promise.all([
      this.drizzleService.db
        .select()
        .from(reviewsSchema)
        .where(eq(reviewsSchema.reviewedId, reviewedId))
        .orderBy(desc(reviewsSchema.createdAt))
        .limit(options.limit)
        .offset(options.offset),
      this.drizzleService.db
        .select({ value: count() })
        .from(reviewsSchema)
        .where(eq(reviewsSchema.reviewedId, reviewedId)),
    ]);

    return {
      data: rows.map((row) => this.mapToEntity(row)),
      total: totalRow[0]?.value ?? 0,
    };
  }

  async ratingSummary(reviewedId: string): Promise<RatingSummary> {
    const rows = await this.drizzleService.db
      .select({
        rating: reviewsSchema.rating,
        c: count(),
      })
      .from(reviewsSchema)
      .where(eq(reviewsSchema.reviewedId, reviewedId))
      .groupBy(reviewsSchema.rating);

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let total = 0;
    let sumRatings = 0;
    for (const row of rows) {
      const r = row.rating as 1 | 2 | 3 | 4 | 5;
      const c = Number(row.c);
      distribution[r] = c;
      total += c;
      sumRatings += r * c;
    }
    return {
      count: total,
      average: total === 0 ? 0 : Number((sumRatings / total).toFixed(2)),
      distribution,
    };
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

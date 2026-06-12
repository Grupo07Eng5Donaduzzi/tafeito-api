import type { Review } from '../models/review.entity';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface RatingSummary {
  count: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewsPage {
  data: Review[];
  total: number;
}

export interface ReviewRepository {
  create(review: Review): Promise<Review>;
  update(review: Review): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  findByServiceAndReviewer(serviceId: string, reviewerId: string): Promise<Review | null>;
  findByServiceId(
    serviceId: string,
    options: { limit: number; offset: number },
  ): Promise<ReviewsPage>;
  ratingSummaryByService(serviceId: string): Promise<RatingSummary>;
}

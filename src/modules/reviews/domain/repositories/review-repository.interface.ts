import type { Review } from '../models/review.entity';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface ReviewRepository {
  create(review: Review): Promise<void>;
  update(review: Review): Promise<void>;
  findById(id: string): Promise<Review | null>;
  findByProposalId(proposalId: string): Promise<Review | null>;
  findByReviewedId(reviewedId: string): Promise<Review[]>;
}

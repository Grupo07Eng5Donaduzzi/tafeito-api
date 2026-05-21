import { IsInt, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import type { Review } from '../../domain/models/review.entity';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @ValidateIf((o) => o.comment !== null)
  @IsString()
  comment?: string | null;
}

export class ReviewDto {
  id: string;
  proposalId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;

  static from(review: Review | null): ReviewDto | null {
    if (!review) return null;
    const dto = new ReviewDto();
    dto.id = review.id!;
    dto.proposalId = review.proposalId;
    dto.reviewerId = review.reviewerId;
    dto.reviewedId = review.reviewedId;
    dto.rating = review.rating;
    dto.comment = review.comment;
    dto.createdAt = review.createdAt!;
    dto.updatedAt = review.updatedAt!;
    return dto;
  }
}

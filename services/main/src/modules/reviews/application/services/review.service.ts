import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProposalService } from '../../../proposal/application/services/proposal.service';
import { ProposalStatus } from '../../../proposal/domain/models/proposal.entity';
import { Review } from '../../domain/models/review.entity';
import {
  REVIEW_REPOSITORY,
  type RatingSummary,
} from '../../domain/repositories/review-repository.interface';
import type { ReviewRepository } from '../../domain/repositories/review-repository.interface';
import { UniqueReviewViolation } from '../../infra/repositories/drizzle-review.repository';
import {
  CreateReviewDto,
  ProviderReviewsPageDto,
  ReviewDto,
  UpdateReviewDto,
} from '../dto/review.dto';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class ReviewService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: ReviewRepository,
    private readonly proposalService: ProposalService,
  ) {}

  async createReview(
    proposalId: string,
    clientId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    const proposal = await this.proposalService.getProposal(proposalId);

    if (proposal.status !== ProposalStatus.COMPLETED) {
      throw new BadRequestException(
        'Review can only be created after service is completed',
      );
    }

    if (proposal.clientId !== clientId) {
      throw new ForbiddenException('Only the client can review this service');
    }

    const review = Review.create({
      proposalId,
      reviewerId: clientId,
      reviewedId: proposal.providerId,
      rating: dto.rating,
      comment: dto.comment,
    });

    try {
      const persisted = await this.reviewRepository.create(review);
      return ReviewDto.from(persisted)!;
    } catch (err) {
      if (err instanceof UniqueReviewViolation) {
        throw new ConflictException(
          'A review already exists for this proposal',
        );
      }
      throw err;
    }
  }

  async updateReview(
    reviewId: string,
    clientId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewDto> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== clientId) {
      throw new ForbiddenException('Only the review author can update it');
    }

    review.updateRating(dto.rating, dto.comment);
    const persisted = await this.reviewRepository.update(review);
    return ReviewDto.from(persisted)!;
  }

  async getReviewByProposal(
    proposalId: string,
    userId: string,
  ): Promise<ReviewDto> {
    const proposal = await this.proposalService.getProposal(proposalId);

    if (proposal.clientId !== userId && proposal.providerId !== userId) {
      throw new ForbiddenException(
        'Only proposal participants can access this review',
      );
    }

    const review = await this.reviewRepository.findByProposalId(proposalId);
    if (!review) {
      throw new NotFoundException('Review not found for this proposal');
    }

    return ReviewDto.from(review)!;
  }

  async getReviewsByProvider(
    providerId: string,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<ProviderReviewsPageDto> {
    const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safePageSize;

    const { data, total } = await this.reviewRepository.findByReviewedId(
      providerId,
      { limit: safePageSize, offset },
    );

    return {
      data: data.map((r) => ReviewDto.from(r)!),
      total,
      page: safePage,
      limit: safePageSize,
      hasMore: offset + data.length < total,
    };
  }

  async getRatingSummary(providerId: string): Promise<RatingSummary> {
    return this.reviewRepository.ratingSummary(providerId);
  }
}

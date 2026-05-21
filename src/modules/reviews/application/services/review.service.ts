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
} from '../../domain/repositories/review-repository.interface';
import type { ReviewRepository } from '../../domain/repositories/review-repository.interface';
import { CreateReviewDto, ReviewDto, UpdateReviewDto } from '../dto/review.dto';

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

    const existing = await this.reviewRepository.findByProposalId(proposalId);
    if (existing) {
      throw new ConflictException('A review already exists for this proposal');
    }

    const review = Review.create({
      proposalId,
      reviewerId: clientId,
      reviewedId: proposal.providerId,
      rating: dto.rating,
      comment: dto.comment,
    });

    await this.reviewRepository.create(review);
    const created = await this.reviewRepository.findByProposalId(proposalId);
    return ReviewDto.from(created)!;
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
    await this.reviewRepository.update(review);

    const updated = await this.reviewRepository.findById(reviewId);
    return ReviewDto.from(updated)!;
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

  async getReviewsByProvider(providerId: string): Promise<ReviewDto[]> {
    const reviews = await this.reviewRepository.findByReviewedId(providerId);
    return reviews.map((r) => ReviewDto.from(r)!);
  }
}

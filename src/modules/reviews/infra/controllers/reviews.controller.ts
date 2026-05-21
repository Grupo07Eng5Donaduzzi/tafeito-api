import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { ReviewService } from '../../application/services/review.service';
import {
  CreateReviewDto,
  ReviewDto,
  UpdateReviewDto,
} from '../../application/dto/review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('proposals/:proposalId')
  async create(
    @Param('proposalId') proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.createReview(proposalId, clientId, body);
  }

  @Patch(':reviewId')
  async update(
    @Param('reviewId') reviewId: string,
    @CurrentUser() clientId: string,
    @Body() body: UpdateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.updateReview(reviewId, clientId, body);
  }

  @Get('proposals/:proposalId')
  async getByProposal(
    @Param('proposalId') proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<ReviewDto> {
    return this.reviewService.getReviewByProposal(proposalId, userId);
  }

  @Get('provider/:providerId')
  async getByProvider(
    @Param('providerId') providerId: string,
  ): Promise<ReviewDto[]> {
    return this.reviewService.getReviewsByProvider(providerId);
  }
}

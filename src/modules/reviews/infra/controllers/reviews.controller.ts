import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { ReviewService } from '../../application/services/review.service';
import {
  CreateReviewDto,
  ProviderReviewsPageDto,
  ReviewDto,
  UpdateReviewDto,
} from '../../application/dto/review.dto';
import type { RatingSummary } from '../../domain/repositories/review-repository.interface';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('proposals/:proposalId')
  async create(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.createReview(proposalId, clientId, body);
  }

  @Patch(':reviewId')
  async update(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() clientId: string,
    @Body() body: UpdateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.updateReview(reviewId, clientId, body);
  }

  @Get('proposals/:proposalId')
  async getByProposal(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<ReviewDto> {
    return this.reviewService.getReviewByProposal(proposalId, userId);
  }

  @Get('provider/:providerId')
  async getByProvider(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ): Promise<ProviderReviewsPageDto> {
    return this.reviewService.getReviewsByProvider(providerId, page, pageSize);
  }

  @Get('provider/:providerId/summary')
  async getProviderSummary(
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<RatingSummary> {
    return this.reviewService.getRatingSummary(providerId);
  }
}

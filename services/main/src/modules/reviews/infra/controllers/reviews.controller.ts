import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { HateoasItem, HateoasList } from '@shared/infra/hateoas';
import { ReviewService } from '../../application/services/review.service';
import {
  CreateReviewDto,
  ProviderReviewsPageDto,
  ReviewDto,
  UpdateReviewDto,
} from '../../application/dto/review.dto';
import type { RatingSummary } from '../../domain/repositories/review-repository.interface';

@ApiTags('Reviews')
@ApiBearerAuth('access-token')
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

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':reviewId')
  async update(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() clientId: string,
    @Body() body: UpdateReviewDto,
  ): Promise<void> {
    await this.reviewService.updateReview(reviewId, clientId, body);
  }

  @Get('proposals/:proposalId')
  @HateoasItem<ReviewDto>({
    basePath: '/reviews',
    itemLinks: (item) => ({
      self: { href: `/reviews/proposals/${item.proposalId}`, method: 'GET' },
      update: { href: `/reviews/${item.id}`, method: 'PATCH' },
      proposal: { href: `/proposals/${item.proposalId}`, method: 'GET' },
      provider: { href: `/reviews/provider/${item.reviewedId}`, method: 'GET' },
    }),
  })
  async getByProposal(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<ReviewDto> {
    return this.reviewService.getReviewByProposal(proposalId, userId);
  }

  @Get('provider/:providerId')
  @HateoasList<ReviewDto>({
    basePath: '/reviews/provider',
    itemLinks: (item) => ({
      self: { href: `/reviews/proposals/${item.proposalId}`, method: 'GET' },
      update: { href: `/reviews/${item.id}`, method: 'PATCH' },
      proposal: { href: `/proposals/${item.proposalId}`, method: 'GET' },
    }),
  })
  async getByProvider(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
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

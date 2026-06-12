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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { HateoasItem, HateoasList } from '@shared/infra/hateoas';
import { ReviewService } from '../../application/services/review.service';
import {
  CreateReviewDto,
  ReviewDto,
  ServiceReviewsPageDto,
  UpdateReviewDto,
} from '../../application/dto/review.dto';
import type { RatingSummary } from '../../domain/repositories/review-repository.interface';

@ApiTags('Reviews')
@ApiBearerAuth('access-token')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({ summary: 'Create a review for a service' })
  @Post('services/:serviceId')
  async create(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @CurrentUser() clientId: string,
    @Body() body: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewService.createReview(serviceId, clientId, body);
  }

  @ApiOperation({ summary: 'Update a review' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':reviewId')
  async update(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @CurrentUser() clientId: string,
    @Body() body: UpdateReviewDto,
  ): Promise<void> {
    await this.reviewService.updateReview(reviewId, clientId, body);
  }

  @ApiOperation({ summary: 'Get my review for a specific service' })
  @HateoasItem<ReviewDto>({
    basePath: '/reviews',
    itemLinks: (item) => ({
      self: { href: `/reviews/services/${item.serviceId}/my`, method: 'GET' },
      update: { href: `/reviews/${item.id}`, method: 'PATCH' },
      service: { href: `/services/${item.serviceId}`, method: 'GET' },
    }),
  })
  @Get('services/:serviceId/my')
  async getMyReview(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @CurrentUser() userId: string,
  ): Promise<ReviewDto> {
    return this.reviewService.getMyReviewForService(serviceId, userId);
  }

  @ApiOperation({ summary: 'List all reviews for a service' })
  @HateoasList<ReviewDto>({
    basePath: '/reviews/services',
    itemLinks: (item) => ({
      self: { href: `/reviews/services/${item.serviceId}/my`, method: 'GET' },
      update: { href: `/reviews/${item.id}`, method: 'PATCH' },
      service: { href: `/services/${item.serviceId}`, method: 'GET' },
    }),
  })
  @Get('services/:serviceId')
  async getByService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query('_page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('_size', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ): Promise<ServiceReviewsPageDto> {
    return this.reviewService.getReviewsByService(serviceId, page, pageSize);
  }

  @ApiOperation({ summary: 'Get rating summary for a service' })
  @Get('services/:serviceId/summary')
  async getServiceSummary(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<RatingSummary> {
    return this.reviewService.getRatingSummaryByService(serviceId);
  }
}

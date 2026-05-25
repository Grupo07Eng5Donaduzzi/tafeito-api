import { Module } from '@nestjs/common';
import { ContestacaoModule } from '../proposal/contestacao.module';
import { ReviewService } from './application/services/review.service';
import { ReviewsController } from './infra/controllers/reviews.controller';
import { DrizzleReviewRepository } from './infra/repositories/drizzle-review.repository';
import { REVIEW_REPOSITORY } from './domain/repositories/review-repository.interface';

@Module({
  imports: [ContestacaoModule],
  controllers: [ReviewsController],
  providers: [
    ReviewService,
    {
      provide: REVIEW_REPOSITORY,
      useClass: DrizzleReviewRepository,
    },
  ],
})
export class ReviewsModule {}

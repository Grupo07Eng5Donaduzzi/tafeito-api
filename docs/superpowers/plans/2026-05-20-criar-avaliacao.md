# Criar Avaliação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a `reviews` module so a client can rate (1–5 stars) and comment on a provider after a proposal reaches `COMPLETED` status.

**Architecture:** New isolated `ReviewsModule` following the existing Clean Architecture pattern (domain → application → infra). `ReviewService` injects `ProposalService` (already exported by `ContestacaoModule`) to validate `COMPLETED` status without circular deps.

**Tech Stack:** NestJS, Drizzle ORM, PostgreSQL, class-validator, Jest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/modules/reviews/domain/models/review.entity.ts` | Create | `Review` entity with `create`, `restore`, `updateRating` |
| `src/modules/reviews/domain/repositories/review-repository.interface.ts` | Create | `ReviewRepository` interface + `REVIEW_REPOSITORY` symbol |
| `src/modules/reviews/application/dto/review.dto.ts` | Create | `CreateReviewDto`, `UpdateReviewDto`, `ReviewDto` |
| `src/modules/reviews/application/services/review.service.ts` | Create | Business logic: create, update, findByProposal, findByProvider |
| `src/modules/reviews/infra/schemas/review.schema.ts` | Create | Drizzle table definition |
| `src/modules/reviews/infra/repositories/drizzle-review.repository.ts` | Create | Drizzle implementation of `ReviewRepository` |
| `src/modules/reviews/infra/controllers/reviews.controller.ts` | Create | HTTP endpoints |
| `src/modules/reviews/reviews.module.ts` | Create | NestJS module wiring |
| `src/shared/infra/database/drizzle.service.ts` | Modify | Add `reviewsSchema` to schema map |
| `src/app.module.ts` | Modify | Register `ReviewsModule` |
| `src/modules/reviews/domain/models/review.entity.spec.ts` | Create | Unit tests for entity |
| `src/modules/reviews/application/services/review.service.spec.ts` | Create | Unit tests for service |

---

## Task 1: Review Entity

**Files:**
- Create: `src/modules/reviews/domain/models/review.entity.ts`
- Create: `src/modules/reviews/domain/models/review.entity.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/reviews/domain/models/review.entity.spec.ts
import { Review } from './review.entity';

describe('Review', () => {
  const baseProps = {
    proposalId: 'prop-1',
    reviewerId: 'client-1',
    reviewedId: 'provider-1',
    rating: 4,
    comment: 'Great service',
  };

  describe('create', () => {
    it('creates review with valid data', () => {
      const review = Review.create(baseProps);
      expect(review.proposalId).toBe('prop-1');
      expect(review.reviewerId).toBe('client-1');
      expect(review.reviewedId).toBe('provider-1');
      expect(review.rating).toBe(4);
      expect(review.comment).toBe('Great service');
      expect(review.id).toBeUndefined();
    });

    it('creates review without comment', () => {
      const review = Review.create({ ...baseProps, comment: undefined });
      expect(review.comment).toBeUndefined();
    });

    it('throws when rating below 1', () => {
      expect(() => Review.create({ ...baseProps, rating: 0 })).toThrow(
        'Rating must be between 1 and 5',
      );
    });

    it('throws when rating above 5', () => {
      expect(() => Review.create({ ...baseProps, rating: 6 })).toThrow(
        'Rating must be between 1 and 5',
      );
    });
  });

  describe('updateRating', () => {
    it('updates rating and comment', () => {
      const review = Review.create(baseProps);
      review.updateRating(5, 'Updated comment');
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Updated comment');
    });

    it('throws when new rating is invalid', () => {
      const review = Review.create(baseProps);
      expect(() => review.updateRating(0)).toThrow(
        'Rating must be between 1 and 5',
      );
    });
  });

  describe('restore', () => {
    it('restores review from persistence', () => {
      const now = new Date();
      const review = Review.restore({
        id: 'rev-1',
        proposalId: 'prop-1',
        reviewerId: 'client-1',
        reviewedId: 'provider-1',
        rating: 3,
        comment: 'Ok',
        createdAt: now,
        updatedAt: now,
      });
      expect(review.id).toBe('rev-1');
      expect(review.rating).toBe(3);
      expect(review.createdAt).toBe(now);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=review.entity.spec --no-coverage
```

Expected: FAIL — `Review` not found

- [ ] **Step 3: Write the entity**

```typescript
// src/modules/reviews/domain/models/review.entity.ts
export class Review {
  private _id?: string;
  private _proposalId: string;
  private _reviewerId: string;
  private _reviewedId: string;
  private _rating: number;
  private _comment?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  private constructor() {}

  get id() { return this._id; }
  get proposalId() { return this._proposalId; }
  get reviewerId() { return this._reviewerId; }
  get reviewedId() { return this._reviewedId; }
  get rating() { return this._rating; }
  get comment() { return this._comment; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  private static validateRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
  }

  static create(props: {
    proposalId: string;
    reviewerId: string;
    reviewedId: string;
    rating: number;
    comment?: string;
  }): Review {
    Review.validateRating(props.rating);
    const review = new Review();
    review._proposalId = props.proposalId;
    review._reviewerId = props.reviewerId;
    review._reviewedId = props.reviewedId;
    review._rating = props.rating;
    review._comment = props.comment;
    return review;
  }

  static restore(props: {
    id: string;
    proposalId: string;
    reviewerId: string;
    reviewedId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
  }): Review {
    const review = new Review();
    review._id = props.id;
    review._proposalId = props.proposalId;
    review._reviewerId = props.reviewerId;
    review._reviewedId = props.reviewedId;
    review._rating = props.rating;
    review._comment = props.comment;
    review._createdAt = props.createdAt;
    review._updatedAt = props.updatedAt;
    return review;
  }

  updateRating(rating: number, comment?: string): void {
    Review.validateRating(rating);
    this._rating = rating;
    this._comment = comment;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest --testPathPattern=review.entity.spec --no-coverage
```

Expected: PASS — 8 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/modules/reviews/domain/models/review.entity.ts src/modules/reviews/domain/models/review.entity.spec.ts
git commit -m "feat(reviews): add Review entity with rating validation"
```

---

## Task 2: Repository Interface + Drizzle Schema

**Files:**
- Create: `src/modules/reviews/domain/repositories/review-repository.interface.ts`
- Create: `src/modules/reviews/infra/schemas/review.schema.ts`

- [ ] **Step 1: Create the repository interface**

```typescript
// src/modules/reviews/domain/repositories/review-repository.interface.ts
import type { Review } from '../models/review.entity';

export const REVIEW_REPOSITORY = Symbol('REVIEW_REPOSITORY');

export interface ReviewRepository {
  create(review: Review): Promise<void>;
  update(review: Review): Promise<void>;
  findById(id: string): Promise<Review | null>;
  findByProposalId(proposalId: string): Promise<Review | null>;
  findByReviewedId(reviewedId: string): Promise<Review[]>;
}
```

- [ ] **Step 2: Create the Drizzle schema**

```typescript
// src/modules/reviews/infra/schemas/review.schema.ts
import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { usersSchema } from '../../../users/infra/schemas/user.schema';
import { proposalsSchema } from '../../../proposal/infra/schemas/proposal.schema';

export const reviewsSchema = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .references(() => proposalsSchema.id)
    .notNull()
    .unique(),
  reviewerId: uuid('reviewer_id')
    .references(() => usersSchema.id)
    .notNull(),
  reviewedId: uuid('reviewed_id')
    .references(() => usersSchema.id)
    .notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
```

- [ ] **Step 3: Add `reviewsSchema` to DrizzleService schema map**

Open `src/shared/infra/database/drizzle.service.ts` and add the import and schema entry:

```typescript
// Add import near the top (after existing schema imports):
import { reviewsSchema } from '../../../modules/reviews/infra/schemas/review.schema';

// Add to the schema object:
const schema = {
  usersSchema,
  servicesSchema,
  budgetRequestsSchema,
  messageSchema,
  conversationSchema,
  reviewsSchema,   // <-- add this line
};
```

- [ ] **Step 4: Run the build to verify no type errors**

```bash
npx nest build --tsc
```

Expected: exits 0, no errors

- [ ] **Step 5: Commit**

```bash
git add src/modules/reviews/domain/repositories/review-repository.interface.ts src/modules/reviews/infra/schemas/review.schema.ts src/shared/infra/database/drizzle.service.ts
git commit -m "feat(reviews): add ReviewRepository interface and Drizzle schema"
```

---

## Task 3: DTOs

**Files:**
- Create: `src/modules/reviews/application/dto/review.dto.ts`

- [ ] **Step 1: Create the DTOs**

```typescript
// src/modules/reviews/application/dto/review.dto.ts
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
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
  @IsString()
  comment?: string;
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
```

- [ ] **Step 2: Run the build to verify no type errors**

```bash
npx nest build --tsc
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/modules/reviews/application/dto/review.dto.ts
git commit -m "feat(reviews): add CreateReviewDto, UpdateReviewDto, ReviewDto"
```

---

## Task 4: Drizzle Repository

**Files:**
- Create: `src/modules/reviews/infra/repositories/drizzle-review.repository.ts`

- [ ] **Step 1: Create the Drizzle repository**

```typescript
// src/modules/reviews/infra/repositories/drizzle-review.repository.ts
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import { Review } from '../../domain/models/review.entity';
import type { ReviewRepository } from '../../domain/repositories/review-repository.interface';
import { reviewsSchema } from '../schemas/review.schema';

@Injectable()
export class DrizzleReviewRepository implements ReviewRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(review: Review): Promise<void> {
    await this.drizzleService.db.insert(reviewsSchema).values({
      proposalId: review.proposalId,
      reviewerId: review.reviewerId,
      reviewedId: review.reviewedId,
      rating: review.rating,
      comment: review.comment ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async update(review: Review): Promise<void> {
    await this.drizzleService.db
      .update(reviewsSchema)
      .set({
        rating: review.rating,
        comment: review.comment ?? null,
        updatedAt: new Date(),
      })
      .where(eq(reviewsSchema.id, review.id!));
  }

  async findById(id: string): Promise<Review | null> {
    const result = await this.drizzleService.db
      .select()
      .from(reviewsSchema)
      .where(eq(reviewsSchema.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByProposalId(proposalId: string): Promise<Review | null> {
    const result = await this.drizzleService.db
      .select()
      .from(reviewsSchema)
      .where(eq(reviewsSchema.proposalId, proposalId))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByReviewedId(reviewedId: string): Promise<Review[]> {
    const result = await this.drizzleService.db
      .select()
      .from(reviewsSchema)
      .where(eq(reviewsSchema.reviewedId, reviewedId))
      .orderBy(reviewsSchema.createdAt);

    return result.map((row) => this.mapToEntity(row));
  }

  private mapToEntity(row: any): Review {
    return Review.restore({
      id: row.id,
      proposalId: row.proposalId,
      reviewerId: row.reviewerId,
      reviewedId: row.reviewedId,
      rating: row.rating,
      comment: row.comment ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
```

- [ ] **Step 2: Run the build to verify no type errors**

```bash
npx nest build --tsc
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/modules/reviews/infra/repositories/drizzle-review.repository.ts
git commit -m "feat(reviews): add DrizzleReviewRepository"
```

---

## Task 5: Review Service

**Files:**
- Create: `src/modules/reviews/application/services/review.service.ts`
- Create: `src/modules/reviews/application/services/review.service.spec.ts`

- [ ] **Step 1: Write the failing service tests**

```typescript
// src/modules/reviews/application/services/review.service.spec.ts
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Review } from '../../domain/models/review.entity';

const makeProposal = (overrides = {}) => ({
  id: 'prop-1',
  clientId: 'client-1',
  providerId: 'provider-1',
  status: 'COMPLETED',
  requestId: 'req-1',
  estimatedHours: 2,
  hourlyRate: 50,
  amount: 100,
  canResubmit: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeReview = (rating = 4) =>
  Review.restore({
    id: 'rev-1',
    proposalId: 'prop-1',
    reviewerId: 'client-1',
    reviewedId: 'provider-1',
    rating,
    comment: 'Good',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepo: any;
  let proposalService: any;

  beforeEach(() => {
    reviewRepo = {
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByProposalId: jest.fn(),
      findByReviewedId: jest.fn(),
    };
    proposalService = {
      getProposal: jest.fn(),
    };
    service = new ReviewService(reviewRepo, proposalService);
  });

  describe('createReview', () => {
    it('creates review when proposal is COMPLETED and user is client', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.findByProposalId
        .mockResolvedValueOnce(null)          // existence check → no duplicate
        .mockResolvedValueOnce(makeReview(5)); // fetch after create

      const result = await service.createReview('prop-1', 'client-1', { rating: 5, comment: 'Great' });
      expect(result.rating).toBe(5);
      expect(result.reviewerId).toBe('client-1');
    });

    it('throws 404 when proposal not found', async () => {
      proposalService.getProposal.mockRejectedValue(new NotFoundException());
      await expect(service.createReview('bad-id', 'client-1', { rating: 5 })).rejects.toThrow(NotFoundException);
    });

    it('throws 400 when proposal not COMPLETED', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal({ status: 'ACCEPTED' }));
      await expect(service.createReview('prop-1', 'client-1', { rating: 5 })).rejects.toThrow(BadRequestException);
    });

    it('throws 403 when user is not the client', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      await expect(service.createReview('prop-1', 'other-user', { rating: 5 })).rejects.toThrow(ForbiddenException);
    });

    it('throws 409 when review already exists for proposal', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.findByProposalId.mockResolvedValue(makeReview(4));
      await expect(service.createReview('prop-1', 'client-1', { rating: 5 })).rejects.toThrow(ConflictException);
    });
  });

  describe('updateReview', () => {
    it('updates review when caller is owner', async () => {
      reviewRepo.findById
        .mockResolvedValueOnce(makeReview(3))  // fetch for auth check
        .mockResolvedValueOnce(makeReview(5)); // fetch after update

      const result = await service.updateReview('rev-1', 'client-1', { rating: 5 });
      expect(result.rating).toBe(5);
    });

    it('throws 404 when review not found', async () => {
      reviewRepo.findById.mockResolvedValue(null);
      await expect(service.updateReview('bad-id', 'client-1', { rating: 4 })).rejects.toThrow(NotFoundException);
    });

    it('throws 403 when caller is not owner', async () => {
      reviewRepo.findById.mockResolvedValue(makeReview(3));
      await expect(service.updateReview('rev-1', 'other-user', { rating: 4 })).rejects.toThrow(ForbiddenException);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=review.service.spec --no-coverage
```

Expected: FAIL — `ReviewService` not found

- [ ] **Step 3: Write the service**

```typescript
// src/modules/reviews/application/services/review.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProposalService } from '../../../proposal/application/services/proposal.service';
import { Review } from '../../domain/models/review.entity';
import {
  REVIEW_REPOSITORY,
  ReviewRepository,
} from '../../domain/repositories/review-repository.interface';
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

    if (proposal.status !== 'COMPLETED') {
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest --testPathPattern=review.service.spec --no-coverage
```

Expected: PASS — all tests passing

- [ ] **Step 5: Commit**

```bash
git add src/modules/reviews/application/services/review.service.ts src/modules/reviews/application/services/review.service.spec.ts
git commit -m "feat(reviews): add ReviewService with create/update/query logic"
```

---

## Task 6: Controller

**Files:**
- Create: `src/modules/reviews/infra/controllers/reviews.controller.ts`

- [ ] **Step 1: Create the controller**

```typescript
// src/modules/reviews/infra/controllers/reviews.controller.ts
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
```

- [ ] **Step 2: Run the build to verify no type errors**

```bash
npx nest build --tsc
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add src/modules/reviews/infra/controllers/reviews.controller.ts
git commit -m "feat(reviews): add ReviewsController with CRUD endpoints"
```

---

## Task 7: Module + AppModule Registration

**Files:**
- Create: `src/modules/reviews/reviews.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create the Reviews module**

```typescript
// src/modules/reviews/reviews.module.ts
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
```

- [ ] **Step 2: Register in AppModule**

Open `src/app.module.ts` and add the import:

```typescript
// Add import:
import { ReviewsModule } from './modules/reviews/reviews.module';

// Add to imports array:
@Module({
  imports: [
    SharedModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    BudgetRequestsModule,
    ChatModule,
    ContestacaoModule,
    PaymentsModule,
    ReviewsModule,   // <-- add this line
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Run full build**

```bash
npx nest build --tsc
```

Expected: exits 0

- [ ] **Step 4: Run all review tests**

```bash
npx jest --testPathPattern=reviews --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/reviews/reviews.module.ts src/app.module.ts
git commit -m "feat(reviews): wire ReviewsModule and register in AppModule"
```

---

## Task 8: Database Migration

- [ ] **Step 1: Generate migration**

```bash
npm run db:generate
```

Expected: new migration file created in the drizzle migrations folder with `CREATE TABLE reviews`

- [ ] **Step 2: Review the generated migration**

Open the generated SQL file and verify it contains:
- `CREATE TABLE "reviews"` with columns: `id`, `proposal_id`, `reviewer_id`, `reviewed_id`, `rating`, `comment`, `created_at`, `updated_at`
- `UNIQUE` constraint on `proposal_id`
- FK references to `proposals` and `users`

- [ ] **Step 3: Apply migration to local DB**

```bash
npm run db:migrate
```

Expected: migration runs without errors

- [ ] **Step 4: Start the server and smoke test**

```bash
npm run start:dev
```

In a new terminal, create a review (replace tokens/ids with real values from your DB):

```bash
curl -X POST http://localhost:3000/reviews/proposals/<proposalId> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clientToken>" \
  -d '{"rating": 5, "comment": "Excelente serviço!"}'
```

Expected: 201 response with `ReviewDto` JSON

- [ ] **Step 5: Commit migration**

```bash
git add drizzle/
git commit -m "feat(reviews): add reviews table migration"
```

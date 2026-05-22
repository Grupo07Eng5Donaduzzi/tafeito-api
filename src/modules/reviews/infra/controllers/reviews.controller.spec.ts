import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ReviewsController } from './reviews.controller';
import { ReviewService } from '../../application/services/review.service';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const OTHER_UUID = '22222222-2222-4222-8222-222222222222';

describe('ReviewsController', () => {
  let app: any;
  let service: jest.Mocked<ReviewService>;

  beforeEach(async () => {
    service = {
      createReview: jest.fn(),
      updateReview: jest.fn(),
      getReviewByProposal: jest.fn(),
      getReviewsByProvider: jest.fn(),
      getRatingSummary: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [{ provide: ReviewService, useValue: service }],
    }).compile();

    app = module.createNestApplication();
    app.use((req: any, _res: any, next: any) => {
      req.user = { id: VALID_UUID };
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /reviews/proposals/:proposalId', () => {
    it('returns 400 when proposalId is not a UUID', async () => {
      await request(app.getHttpServer())
        .post('/reviews/proposals/not-a-uuid')
        .send({ rating: 5 })
        .expect(400);
      expect(service.createReview).not.toHaveBeenCalled();
    });

    it('returns 400 when rating is out of range', async () => {
      await request(app.getHttpServer())
        .post(`/reviews/proposals/${VALID_UUID}`)
        .send({ rating: 6 })
        .expect(400);
      expect(service.createReview).not.toHaveBeenCalled();
    });

    it('returns 400 when extra fields are present', async () => {
      await request(app.getHttpServer())
        .post(`/reviews/proposals/${VALID_UUID}`)
        .send({ rating: 5, hacker: 'pwn' })
        .expect(400);
    });

    it('returns 400 when comment exceeds 2000 chars', async () => {
      await request(app.getHttpServer())
        .post(`/reviews/proposals/${VALID_UUID}`)
        .send({ rating: 5, comment: 'a'.repeat(2001) })
        .expect(400);
    });

    it('forwards rating + clientId to the service', async () => {
      service.createReview.mockResolvedValue({
        id: OTHER_UUID,
        proposalId: VALID_UUID,
        reviewerId: VALID_UUID,
        reviewedId: 'p',
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await request(app.getHttpServer())
        .post(`/reviews/proposals/${VALID_UUID}`)
        .send({ rating: 5, comment: 'Otimo' })
        .expect(201);

      expect(service.createReview).toHaveBeenCalledWith(
        VALID_UUID,
        VALID_UUID,
        { rating: 5, comment: 'Otimo' },
      );
    });
  });

  describe('PATCH /reviews/:reviewId', () => {
    it('returns 400 when reviewId is not a UUID', async () => {
      await request(app.getHttpServer())
        .patch('/reviews/not-a-uuid')
        .send({ rating: 4 })
        .expect(400);
    });

    it('passes null comment through (comment clearing)', async () => {
      service.updateReview.mockResolvedValue({
        id: VALID_UUID,
        proposalId: OTHER_UUID,
        reviewerId: VALID_UUID,
        reviewedId: 'p',
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await request(app.getHttpServer())
        .patch(`/reviews/${VALID_UUID}`)
        .send({ rating: 4, comment: null })
        .expect(200);

      expect(service.updateReview).toHaveBeenCalledWith(
        VALID_UUID,
        VALID_UUID,
        { rating: 4, comment: null },
      );
    });
  });

  describe('GET /reviews/provider/:providerId', () => {
    it('parses page/pageSize from query', async () => {
      service.getReviewsByProvider.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        pageSize: 5,
        hasMore: false,
      });

      await request(app.getHttpServer())
        .get(`/reviews/provider/${OTHER_UUID}?page=2&pageSize=5`)
        .expect(200);

      expect(service.getReviewsByProvider).toHaveBeenCalledWith(
        OTHER_UUID,
        2,
        5,
      );
    });

    it('uses defaults when query params absent', async () => {
      service.getReviewsByProvider.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });

      await request(app.getHttpServer())
        .get(`/reviews/provider/${OTHER_UUID}`)
        .expect(200);

      expect(service.getReviewsByProvider).toHaveBeenCalledWith(
        OTHER_UUID,
        1,
        20,
      );
    });

    it('clamps absurd pageSize to MAX_PAGE_SIZE via service', async () => {
      service.getReviewsByProvider.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 100,
        hasMore: false,
      });

      await request(app.getHttpServer())
        .get(`/reviews/provider/${OTHER_UUID}?pageSize=9999`)
        .expect(200);

      expect(service.getReviewsByProvider).toHaveBeenCalledWith(
        OTHER_UUID,
        1,
        9999,
      );
    });
  });

  describe('GET /reviews/provider/:providerId/summary', () => {
    it('returns the aggregated summary from the service', async () => {
      service.getRatingSummary.mockResolvedValue({
        count: 3,
        average: 4.33,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 },
      });

      const response = await request(app.getHttpServer())
        .get(`/reviews/provider/${OTHER_UUID}/summary`)
        .expect(200);

      expect(response.body.count).toBe(3);
      expect(response.body.average).toBe(4.33);
      expect(service.getRatingSummary).toHaveBeenCalledWith(OTHER_UUID);
    });
  });
});

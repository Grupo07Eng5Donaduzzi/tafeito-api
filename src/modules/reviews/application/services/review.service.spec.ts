import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { Review } from '../../domain/models/review.entity';
import { ProposalStatus } from '../../../proposal/domain/models/proposal.entity';
import { UniqueReviewViolation } from '../../infra/repositories/drizzle-review.repository';

const makeProposal = (overrides = {}) => ({
  id: 'prop-1',
  clientId: 'client-1',
  providerId: 'provider-1',
  status: ProposalStatus.COMPLETED,
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
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByProposalId: jest.fn(),
      findByReviewedId: jest.fn(),
      ratingSummary: jest.fn(),
    };
    proposalService = {
      getProposal: jest.fn(),
    };
    service = new ReviewService(reviewRepo, proposalService);
  });

  describe('createReview', () => {
    it('creates review when proposal is COMPLETED and user is client', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.create.mockResolvedValue(makeReview(5));

      const result = await service.createReview('prop-1', 'client-1', {
        rating: 5,
        comment: 'Great',
      });
      expect(result.rating).toBe(5);
      expect(result.reviewerId).toBe('client-1');
      expect(reviewRepo.create).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when proposal not found', async () => {
      proposalService.getProposal.mockRejectedValue(new NotFoundException());
      await expect(
        service.createReview('bad-id', 'client-1', { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 400 when proposal not COMPLETED', async () => {
      proposalService.getProposal.mockResolvedValue(
        makeProposal({ status: ProposalStatus.ACCEPTED }),
      );
      await expect(
        service.createReview('prop-1', 'client-1', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws 403 when user is not the client', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      await expect(
        service.createReview('prop-1', 'other-user', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('translates UniqueReviewViolation from repo into 409', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.create.mockRejectedValue(new UniqueReviewViolation());

      await expect(
        service.createReview('prop-1', 'client-1', { rating: 5 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateReview', () => {
    it('updates review when caller is owner', async () => {
      reviewRepo.findById.mockResolvedValue(makeReview(3));
      reviewRepo.update.mockResolvedValue(makeReview(5));

      const result = await service.updateReview('rev-1', 'client-1', {
        rating: 5,
      });
      expect(result.rating).toBe(5);
    });

    it('throws 404 when review not found', async () => {
      reviewRepo.findById.mockResolvedValue(null);
      await expect(
        service.updateReview('bad-id', 'client-1', { rating: 4 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 403 when caller is not owner', async () => {
      reviewRepo.findById.mockResolvedValue(makeReview(3));
      await expect(
        service.updateReview('rev-1', 'other-user', { rating: 4 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getReviewByProposal', () => {
    it('returns review when userId is the client', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.findByProposalId.mockResolvedValue(makeReview(4));

      const result = await service.getReviewByProposal('prop-1', 'client-1');
      expect(result.proposalId).toBe('prop-1');
      expect(result.rating).toBe(4);
    });

    it('returns review when userId is the provider', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.findByProposalId.mockResolvedValue(makeReview(4));

      const result = await service.getReviewByProposal('prop-1', 'provider-1');
      expect(result.proposalId).toBe('prop-1');
    });

    it('throws 403 when userId is neither client nor provider', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      await expect(
        service.getReviewByProposal('prop-1', 'stranger'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws 404 when review does not exist', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.findByProposalId.mockResolvedValue(null);
      await expect(
        service.getReviewByProposal('prop-1', 'client-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReviewsByProvider', () => {
    it('returns empty page when provider has no reviews', async () => {
      reviewRepo.findByReviewedId.mockResolvedValue({ data: [], total: 0 });
      const result = await service.getReviewsByProvider('provider-1');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('paginates and reports hasMore', async () => {
      reviewRepo.findByReviewedId.mockResolvedValue({
        data: [makeReview(5), makeReview(3)],
        total: 5,
      });
      const result = await service.getReviewsByProvider('provider-1', 1, 2);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.hasMore).toBe(true);
      expect(reviewRepo.findByReviewedId).toHaveBeenCalledWith('provider-1', {
        limit: 2,
        offset: 0,
      });
    });

    it('clamps pageSize to MAX_PAGE_SIZE', async () => {
      reviewRepo.findByReviewedId.mockResolvedValue({ data: [], total: 0 });
      await service.getReviewsByProvider('provider-1', 1, 9999);
      expect(reviewRepo.findByReviewedId).toHaveBeenCalledWith('provider-1', {
        limit: 100,
        offset: 0,
      });
    });
  });

  describe('getRatingSummary', () => {
    it('delegates to the repository', async () => {
      const summary = {
        count: 3,
        average: 4.33,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 },
      };
      reviewRepo.ratingSummary.mockResolvedValue(summary);
      const result = await service.getRatingSummary('provider-1');
      expect(result).toBe(summary);
    });
  });
});

import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Review } from '../../domain/models/review.entity';
import { ProposalStatus } from '../../../proposal/domain/models/proposal.entity';

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
      proposalService.getProposal.mockResolvedValue(makeProposal({ status: ProposalStatus.ACCEPTED }));
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
      await expect(service.getReviewByProposal('prop-1', 'stranger')).rejects.toThrow(ForbiddenException);
    });

    it('throws 404 when review does not exist', async () => {
      proposalService.getProposal.mockResolvedValue(makeProposal());
      reviewRepo.findByProposalId.mockResolvedValue(null);
      await expect(service.getReviewByProposal('prop-1', 'client-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReviewsByProvider', () => {
    it('returns empty array when provider has no reviews', async () => {
      reviewRepo.findByReviewedId.mockResolvedValue([]);
      const result = await service.getReviewsByProvider('provider-1');
      expect(result).toEqual([]);
    });

    it('returns mapped ReviewDto array', async () => {
      reviewRepo.findByReviewedId.mockResolvedValue([makeReview(5), makeReview(3)]);
      const result = await service.getReviewsByProvider('provider-1');
      expect(result).toHaveLength(2);
      expect(result[0].rating).toBe(5);
      expect(result[1].rating).toBe(3);
    });
  });
});

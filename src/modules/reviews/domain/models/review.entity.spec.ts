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

    it('preserves existing comment when comment argument is omitted', () => {
      const review = Review.create(baseProps); // has comment 'Great service'
      review.updateRating(5);
      expect(review.comment).toBe('Great service');
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

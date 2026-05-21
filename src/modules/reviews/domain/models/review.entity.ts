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

import { BadRequestException } from '@nestjs/common';

export class Review {
  private readonly _id?: string;
  private _serviceId: string;
  private _reviewerId: string;
  private _reviewedId: string;
  private _rating: number;
  private _comment?: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined { return this._id; }
  get serviceId(): string { return this._serviceId; }
  get reviewerId(): string { return this._reviewerId; }
  get reviewedId(): string { return this._reviewedId; }
  get rating(): number { return this._rating; }
  get comment(): string | undefined { return this._comment; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  private static validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5');
    }
  }

  static create(props: {
    serviceId: string;
    reviewerId: string;
    reviewedId: string;
    rating: number;
    comment?: string;
  }): Review {
    Review.validateRating(props.rating);
    const review = new Review();
    review._serviceId = props.serviceId;
    review._reviewerId = props.reviewerId;
    review._reviewedId = props.reviewedId;
    review._rating = props.rating;
    review._comment = props.comment;
    return review;
  }

  static restore(props: {
    id: string;
    serviceId: string;
    reviewerId: string;
    reviewedId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
  }): Review {
    Review.validateRating(props.rating);
    const review = new Review(props.id, props.createdAt, props.updatedAt);
    review._serviceId = props.serviceId;
    review._reviewerId = props.reviewerId;
    review._reviewedId = props.reviewedId;
    review._rating = props.rating;
    review._comment = props.comment;
    return review;
  }

  updateRating(rating: number, comment?: string | null): void {
    Review.validateRating(rating);
    this._rating = rating;
    if (comment !== undefined) {
      this._comment = comment ?? undefined;
    }
  }
}

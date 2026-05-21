export class AuditLog {
  private readonly _id?: string;
  private readonly _action: string;
  private readonly _userId?: string;
  private readonly _targetId: string;
  private readonly _details?: any;
  private readonly _createdAt?: Date;

  private constructor(
    action: string,
    targetId: string,
    userId?: string,
    details?: any,
    id?: string,
    createdAt?: Date,
  ) {
    this._action = action;
    this._targetId = targetId;
    this._userId = userId;
    this._details = details;
    this._id = id;
    this._createdAt = createdAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get action(): string {
    return this._action;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get targetId(): string {
    return this._targetId;
  }

  get details(): any | undefined {
    return this._details;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  static create(props: {
    action: string;
    targetId: string;
    userId?: string;
    details?: any;
  }): AuditLog {
    return new AuditLog(
      props.action,
      props.targetId,
      props.userId,
      props.details,
    );
  }

  static restore(props: {
    id: string;
    action: string;
    targetId: string;
    userId?: string;
    details?: any;
    createdAt: Date;
  }): AuditLog {
    return new AuditLog(
      props.action,
      props.targetId,
      props.userId,
      props.details,
      props.id,
      props.createdAt,
    );
  }
}

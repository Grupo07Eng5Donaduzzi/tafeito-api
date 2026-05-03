export interface RestoreConversationData {
  id?: string;
  serviceId: string;
  initiatorId: string;
  participantIds: string[];
  lastMessageAt?: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Conversation {
  private readonly _id?: string;
  private readonly _serviceId: string;
  private readonly _initiatorId: string;
  private _participantIds: string[];
  private _lastMessageAt?: Date;
  private _isActive: boolean;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(
    serviceId: string,
    initiatorId: string,
    participantIds: string[],
    id?: string,
    lastMessageAt?: Date,
    isActive: boolean = true,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id;
    this._serviceId = serviceId;
    this._initiatorId = initiatorId;
    this._participantIds = participantIds;
    this._lastMessageAt = lastMessageAt;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get serviceId(): string {
    return this._serviceId;
  }

  get initiatorId(): string {
    return this._initiatorId;
  }

  get participantIds(): string[] {
    return [...this._participantIds];
  }

  get lastMessageAt(): Date | undefined {
    return this._lastMessageAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  static restore(data: RestoreConversationData): Conversation {
    return new Conversation(
      data.serviceId,
      data.initiatorId,
      data.participantIds,
      data.id,
      data.lastMessageAt,
      data.isActive ?? true,
      data.createdAt,
      data.updatedAt,
    );
  }

  isParticipant(userId: string): boolean {
    return this._participantIds.includes(userId);
  }

  addParticipant(userId: string): void {
    if (!this.isParticipant(userId)) {
      this._participantIds.push(userId);
    }
  }

  removeParticipant(userId: string): void {
    this._participantIds = this._participantIds.filter((id) => id !== userId);
  }

  updateLastMessageAt(date: Date): void {
    this._lastMessageAt = date;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }
}

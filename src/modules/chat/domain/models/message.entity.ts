export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface RestoreMessageData {
  id?: string;
  serviceId: string;
  senderId: string;
  recipientId: string;
  content: string;
  status?: MessageStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Message {
  private readonly _id?: string;
  private readonly _serviceId: string;
  private readonly _senderId: string;
  private readonly _recipientId: string;
  private _content: string;
  private _status: MessageStatus;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(
    serviceId: string,
    senderId: string,
    recipientId: string,
    content: string,
    id?: string,
    status: MessageStatus = 'sent',
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._id = id;
    this._serviceId = serviceId;
    this._senderId = senderId;
    this._recipientId = recipientId;
    this._content = content;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get serviceId(): string {
    return this._serviceId;
  }

  get senderId(): string {
    return this._senderId;
  }

  get recipientId(): string {
    return this._recipientId;
  }

  get content(): string {
    return this._content;
  }

  get status(): MessageStatus {
    return this._status;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  static restore(data: RestoreMessageData): Message {
    return new Message(
      data.serviceId,
      data.senderId,
      data.recipientId,
      data.content,
      data.id,
      data.status ?? 'sent',
      data.createdAt,
      data.updatedAt,
    );
  }

  markAsDelivered(): void {
    if (this._status === 'sent') {
      this._status = 'delivered';
    }
  }

  markAsRead(): void {
    this._status = 'read';
  }

  canEdit(): boolean {
    return this._status === 'sent';
  }

  canDelete(): boolean {
    return true;
  }
}

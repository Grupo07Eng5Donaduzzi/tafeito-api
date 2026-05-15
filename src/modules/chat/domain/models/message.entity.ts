export type MessageStatus = 'sent' | 'delivered' | 'read';

export class Message {
  public id?: string;
  public serviceId: string;
  public conversationId?: string;
  public senderId: string;
  public recipientId: string;
  public content: string;
  public status: MessageStatus;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: {
    serviceId: string;
    conversationId?: string;
    senderId: string;
    recipientId: string;
    content: string;
    status?: MessageStatus;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = data.id;
    this.serviceId = data.serviceId;
    this.conversationId = data.conversationId;
    this.senderId = data.senderId;
    this.recipientId = data.recipientId;
    this.content = data.content;
    this.status = data.status ?? 'sent';
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  static restore(row: any): Message | null {
    if (!row) return null;
    return new Message({
      id: row.id,
      serviceId: row.serviceId ?? row.service_id,
      conversationId: row.conversationId ?? row.conversation_id,
      senderId: row.senderId ?? row.sender_id,
      recipientId: row.recipientId ?? row.recipient_id,
      content: row.content,
      status: row.status,
      createdAt: row.createdAt ?? row.created_at,
      updatedAt: row.updatedAt ?? row.updated_at,
    });
  }

  markAsDelivered(): void {
    if (this.status === 'sent') {
      this.status = 'delivered';
      this.updatedAt = new Date();
    }
  }

  markAsRead(): void {
    this.status = 'read';
    this.updatedAt = new Date();
  }
}

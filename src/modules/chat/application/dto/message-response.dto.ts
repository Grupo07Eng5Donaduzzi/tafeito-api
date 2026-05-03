/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

export type MessageStatus = 'sent' | 'delivered' | 'read';

export class MessageResponseDto {
  private constructor(
    public id: string | undefined,
    public serviceId: string,
    public senderId: string,
    public recipientId: string,
    public content: string,
    public status: MessageStatus,
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
  ) {}

  static from(message: unknown): MessageResponseDto | null {
    if (!message) return null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const msg = message as any;
    return new MessageResponseDto(
      msg.id,
      msg.serviceId,
      msg.senderId,
      msg.recipientId,
      msg.content,
      msg.status,
      msg.createdAt,
      msg.updatedAt,
    );
  }
}

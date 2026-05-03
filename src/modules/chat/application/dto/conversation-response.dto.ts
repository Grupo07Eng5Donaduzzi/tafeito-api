/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

export class ConversationResponseDto {
  private constructor(
    public id: string | undefined,
    public serviceId: string,
    public initiatorId: string,
    public participantIds: string[],
    public lastMessageAt: Date | undefined,
    public isActive: boolean,
    public createdAt: Date | undefined,
    public updatedAt: Date | undefined,
  ) {}

  static from(conversation: unknown): ConversationResponseDto | null {
    if (!conversation) return null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const conv = conversation as any;
    return new ConversationResponseDto(
      conv.id,
      conv.serviceId,
      conv.initiatorId,
      conv.participantIds,
      conv.lastMessageAt,
      conv.isActive,
      conv.createdAt,
      conv.updatedAt,
    );
  }
}

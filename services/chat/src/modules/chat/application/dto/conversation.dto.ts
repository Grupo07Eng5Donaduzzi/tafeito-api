export class ConversationResponseDto {
  id?: string;
  initiatorId!: string;
  participantIds!: string[];
  otherParticipantId?: string;
  lastMessageAt?: Date;
  isActive!: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EnsureConversationDto {
  participantId!: string;
}

export class EnsureConversationResponseDto {
  conversationId!: string;
  isNew!: boolean;
}

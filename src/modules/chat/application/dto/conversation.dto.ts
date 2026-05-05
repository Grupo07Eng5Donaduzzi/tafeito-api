export class ConversationResponseDto {
  id?: string;
  serviceId!: string;
  initiatorId!: string;
  participantIds!: string[];
  lastMessageAt?: Date;
  isActive!: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

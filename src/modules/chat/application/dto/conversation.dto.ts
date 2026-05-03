export class CreateConversationDto {
  serviceId!: string;
  initiatorId!: string;
  participantIds!: string[];
}

export class UpdateConversationDto {
  participantIds?: string[];
  isActive?: boolean;
}

export class Conversation {
  public id?: string;
  public serviceId: string;
  public initiatorId: string;
  public participantIds: string[];
  public lastMessageAt?: Date;
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: {
    serviceId: string;
    initiatorId: string;
    participantIds: string[];
    lastMessageAt?: Date;
    isActive?: boolean;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = data.id;
    this.serviceId = data.serviceId;
    this.initiatorId = data.initiatorId;
    this.participantIds = data.participantIds;
    this.lastMessageAt = data.lastMessageAt;
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  static restore(row: any): Conversation | null {
    if (!row) return null;
    return new Conversation({
      id: row.id,
      serviceId: row.serviceId ?? row.service_id,
      initiatorId: row.initiatorId ?? row.initiator_id,
      participantIds: row.participantIds ?? row.participant_ids ?? [],
      lastMessageAt: row.lastMessageAt ?? row.last_message_at,
      isActive: row.isActive ?? row.is_active ?? true,
      createdAt: row.createdAt ?? row.created_at,
      updatedAt: row.updatedAt ?? row.updated_at,
    });
  }

  updateLastMessageAt(): void {
    this.lastMessageAt = new Date();
    this.updatedAt = new Date();
  }
}

import { Conversation } from '../models/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface ConversationRepository {
  create(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findByParticipants(userId1: string, userId2: string): Promise<Conversation | null>;
  findByParticipantId(userId: string): Promise<Conversation[]>;
  update(conversation: Conversation): Promise<void>;
}

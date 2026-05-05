import { Conversation } from '../models/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface ConversationRepository {
  create(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findByServiceId(serviceId: string): Promise<Conversation[]>;
  update(conversation: Conversation): Promise<void>;
}

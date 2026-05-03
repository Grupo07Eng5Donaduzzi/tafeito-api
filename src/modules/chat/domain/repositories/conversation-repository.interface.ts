import { Conversation } from '../models/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface ConversationRepository {
  create(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | null>;
  findByServiceId(serviceId: string): Promise<Conversation[]>;
  findByServiceIdAndInitiator(
    serviceId: string,
    initiatorId: string,
  ): Promise<Conversation | null>;
  update(conversation: Conversation): Promise<void>;
  delete(id: string): Promise<void>;
}

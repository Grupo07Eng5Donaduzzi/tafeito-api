export enum ChatExchangeName {
  CONVERSATION_CREATED = 'tafeito.chat.conversation-created.exchange',
}

export enum ChatRoutingKey {
  CONVERSATION_CREATED = 'chat.conversation-created',
}

export interface ConversationCreatedPayload {
  proposalId: string;
  conversationId: string;
}

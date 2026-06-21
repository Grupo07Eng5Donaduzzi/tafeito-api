export enum ChatExchangeName {
  CONVERSATION_CREATED = 'tafeito.chat.conversation-created.exchange',
  COMMANDS = 'tafeito.chat.commands.exchange',
}

export enum ChatRoutingKey {
  CONVERSATION_CREATED = 'chat.conversation-created',
  ENSURE_CONVERSATION_AND_SEND_MESSAGE = 'chat.conversation.ensure-and-send-message',
}

export interface ConversationCreatedPayload {
  proposalId: string;
  conversationId: string;
}

export interface EnsureConversationAndSendMessagePayload {
  initiatorId: string;
  participantId: string;
  content: string;
}

export interface EnsureConversationAndSendMessageResponse {
  conversationId: string;
  isNew: boolean;
}

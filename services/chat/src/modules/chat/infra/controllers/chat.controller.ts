import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ForbiddenException,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { HateoasItem } from '@shared/infra/hateoas';
import { MessageService } from '../../application/services/message.service';
import { ConversationService } from '../../application/services/conversation.service';
import {
  SendMessageDto,
  SendConversationMessageDto,
  MessageResponseDto,
  MessageListDto,
} from '../../application/dto/message.dto';
import {
  ConversationResponseDto,
  EnsureConversationDto,
  EnsureConversationResponseDto,
} from '../../application/dto/conversation.dto';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  // ── Conversations ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Garantir que existe uma conversa entre o usuário autenticado e outro usuário' })
  @Post('conversations/ensure')
  async ensureConversation(
    @Body() dto: EnsureConversationDto,
    @CurrentUser() currentUserId: string,
  ): Promise<EnsureConversationResponseDto> {
    return this.conversationService.getOrCreateConversationBetween(
      currentUserId,
      dto.participantId,
    );
  }

  @ApiOperation({ summary: 'Listar conversas do usuário autenticado' })
  @Get('conversations')
  async getMyConversations(
    @CurrentUser() currentUserId: string,
  ): Promise<ConversationResponseDto[]> {
    return this.conversationService.getUserConversations(currentUserId);
  }

  @ApiOperation({ summary: 'Buscar dados de uma conversa por ID' })
  @Get('conversations/:id')
  @HateoasItem<ConversationResponseDto>({
    basePath: '/chat/conversations',
    itemLinks: (item) => ({
      self: { href: `/chat/conversations/${item.id}`, method: 'GET' },
      messages: { href: `/chat/conversations/${item.id}/messages`, method: 'GET' },
      sendMessage: { href: `/chat/conversations/${item.id}/messages`, method: 'POST' },
    }),
  })
  async getConversation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.getConversationById(id);
  }

  // ── Messages ───────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Enviar uma nova mensagem (cria conversa automaticamente se necessario)' })
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.sendMessageAsUser(
      {
        serviceId: dto.serviceId,
        recipientId: dto.recipientId,
        content: dto.content,
      },
      currentUserId,
    );
  }

  @ApiOperation({ summary: 'Buscar uma mensagem por ID' })
  @Get('messages/:id')
  @HateoasItem<MessageResponseDto>({
    basePath: '/chat/messages',
    itemLinks: (item) => ({
      self: { href: `/chat/messages/${item.id}`, method: 'GET' },
      markRead: { href: `/chat/messages/${item.id}/read`, method: 'PATCH' },
      markDelivered: { href: `/chat/messages/${item.id}/delivered`, method: 'PATCH' },
      delete: { href: `/chat/messages/${item.id}`, method: 'DELETE' },
      conversation: item.conversationId
        ? { href: `/chat/conversations/${item.conversationId}`, method: 'GET' }
        : null,
    }),
  })
  async getMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.getMessageByIdForUser(id, currentUserId);
  }

  @ApiOperation({ summary: 'Enviar mensagem em uma conversa existente' })
  @Post('conversations/:conversationId/messages')
  async sendConversationMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendConversationMessageDto,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.sendConversationMessage(
      conversationId,
      currentUserId,
      dto.recipientId,
      dto.content,
    );
  }

  @ApiOperation({ summary: 'Listar mensagens de uma conversa com paginacao' })
  @Get('conversations/:conversationId/messages')
  async getConversationMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() currentUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
  ): Promise<MessageListDto> {
    return this.messageService.getConversationMessagesForUser(
      conversationId,
      currentUserId,
      page,
      pageSize,
    );
  }

  @ApiOperation({ summary: 'Listar mensagens recebidas/enviadas por um usuario' })
  @Get('users/:userId/messages')
  async getUserMessages(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUserId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<MessageResponseDto[]> {
    if (userId !== currentUserId) {
      throw new ForbiddenException('You cannot list messages for this user');
    }
    return this.messageService.getUserMessages(userId, limit);
  }

  @ApiOperation({ summary: 'Marcar mensagem como lida' })
  @Patch('messages/:id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.markAsReadForUser(id, currentUserId);
  }

  @ApiOperation({ summary: 'Marcar mensagem como entregue' })
  @Patch('messages/:id/delivered')
  async markAsDelivered(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.markAsDeliveredForUser(id, currentUserId);
  }

  @ApiOperation({ summary: 'Excluir uma mensagem (somente remetente)' })
  @Delete('messages/:id')
  async deleteMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<void> {
    return this.messageService.deleteMessageForUser(id, currentUserId);
  }
}

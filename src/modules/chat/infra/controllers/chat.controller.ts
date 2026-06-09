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
} from '@nestjs/common';
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
import { ConversationResponseDto } from '../../application/dto/conversation.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

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
    @Param('id') id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.getMessageByIdForUser(id, currentUserId);
  }

  @Post('conversations/:conversationId/messages')
  async sendConversationMessage(
    @Param('conversationId') conversationId: string,
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

  @Get('conversations/:conversationId/messages')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
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

  @Get('services/:serviceId/messages')
  async getServiceMessages(
    @Param('serviceId') serviceId: string,
    @CurrentUser() currentUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
  ): Promise<MessageListDto> {
    return this.messageService.getServiceMessagesForUser(
      serviceId,
      currentUserId,
      page,
      pageSize,
    );
  }

  @Get('users/:userId/messages')
  async getUserMessages(
    @Param('userId') userId: string,
    @CurrentUser() currentUserId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<MessageResponseDto[]> {
    if (userId !== currentUserId) {
      throw new ForbiddenException('You cannot list messages for this user');
    }
    return this.messageService.getUserMessages(userId, limit);
  }

  @Patch('messages/:id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.markAsReadForUser(id, currentUserId);
  }

  @Patch('messages/:id/delivered')
  async markAsDelivered(
    @Param('id') id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.markAsDeliveredForUser(id, currentUserId);
  }

  @Delete('messages/:id')
  async deleteMessage(
    @Param('id') id: string,
    @CurrentUser() currentUserId: string,
  ): Promise<void> {
    return this.messageService.deleteMessageForUser(id, currentUserId);
  }

  @Get('services/:serviceId/conversations')
  async getServiceConversations(
    @Param('serviceId') serviceId: string,
  ): Promise<ConversationResponseDto[]> {
    return this.conversationService.getServiceConversations(serviceId);
  }

  @Get('conversations/:id')
  @HateoasItem<ConversationResponseDto>({
    basePath: '/chat/conversations',
    itemLinks: (item) => ({
      self: { href: `/chat/conversations/${item.id}`, method: 'GET' },
      messages: { href: `/chat/conversations/${item.id}/messages`, method: 'GET' },
      sendMessage: { href: `/chat/conversations/${item.id}/messages`, method: 'POST' },
      service: { href: `/services/${item.serviceId}`, method: 'GET' },
      proposal: item.proposalId
        ? { href: `/proposals/${item.proposalId}`, method: 'GET' }
        : null,
    }),
  })
  async getConversation(
    @Param('id') id: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.getConversationById(id);
  }
}

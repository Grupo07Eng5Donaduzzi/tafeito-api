/* eslint-disable */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { MessageService } from '@chat/application/services/message.service';
import { ConversationService } from '@chat/application/services/conversation.service';
import { SendMessageDto } from '@chat/application/dto/send-message.dto';
import { CreateConversationDto } from '@chat/application/dto/conversation.dto';
import { MessageResponseDto } from '@chat/application/dto/message-response.dto';
import { MessageQueryDto } from '@chat/application/dto/message-query.dto';
import { MessageListResponseDto } from '@chat/application/dto/message-list-response.dto';
import { ConversationResponseDto } from '@chat/application/dto/conversation-response.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  // ===== Messages Endpoints =====

  @Post('messages')
  async sendMessage(@Body() dto: SendMessageDto): Promise<MessageResponseDto> {
    return this.messageService.sendMessage(dto);
  }

  @Get('messages/:id')
  async getMessage(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.messageService.getMessageById(id);
  }

  @Get('services/:serviceId/messages')
  async getServiceMessages(
    @Param('serviceId') serviceId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'senderId',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<MessageResponseDto[] | MessageListResponseDto> {
    // If filters are provided, use the new filtered endpoint
    if (status || startDate || endDate || search || sortBy) {
      const queryDto = new MessageQueryDto();
      queryDto.page = page;
      queryDto.pageSize = pageSize;
      queryDto.status = status as any;
      queryDto.startDate = startDate;
      queryDto.endDate = endDate;
      queryDto.search = search;
      queryDto.sortBy = sortBy;
      queryDto.sortOrder = sortOrder;
      return this.messageService.getServiceMessagesWithFilters(serviceId, queryDto);
    }
    // Fallback to original method for backward compatibility
    return this.messageService.getServiceMessages(serviceId, page || 1, pageSize || 50);
  }

  @Get('users/:userId/sent-messages')
  async getUserSentMessages(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
  ): Promise<MessageResponseDto[]> {
    return this.messageService.getUserMessages(userId, limit);
  }

  @Get('users/:userId/received-messages')
  async getUserReceivedMessages(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
  ): Promise<MessageResponseDto[]> {
    return this.messageService.getReceivedMessages(userId, limit);
  }

  @Patch('messages/:id/read')
  async markMessageAsRead(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.messageService.markAsRead(id);
  }

  @Patch('messages/:id/delivered')
  async markMessageAsDelivered(
    @Param('id') id: string,
  ): Promise<MessageResponseDto> {
    return this.messageService.markAsDelivered(id);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string): Promise<void> {
    return this.messageService.deleteMessage(id);
  }

  @Get('services/:serviceId/messages/count')
  async countServiceMessages(
    @Param('serviceId') serviceId: string,
  ): Promise<{ count: number }> {
    const count = await this.messageService.countServiceMessages(serviceId);
    return { count };
  }

  // ===== Conversations Endpoints =====

  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.createConversation(dto);
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.getConversationById(id);
  }

  @Get('services/:serviceId/conversations')
  async getServiceConversations(
    @Param('serviceId') serviceId: string,
  ): Promise<ConversationResponseDto[]> {
    return this.conversationService.getServiceConversations(serviceId);
  }

  @Patch('conversations/:id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: any,
  ): Promise<ConversationResponseDto> {
    return this.conversationService.updateConversation(id, dto);
  }

  @Patch('conversations/:id/add-participant')
  async addParticipant(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<void> {
    return this.conversationService.addParticipant(id, userId);
  }

  @Patch('conversations/:id/remove-participant')
  async removeParticipant(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ): Promise<void> {
    return this.conversationService.removeParticipant(id, userId);
  }

  @Patch('conversations/:id/deactivate')
  async deactivateConversation(@Param('id') id: string): Promise<void> {
    return this.conversationService.deactivateConversation(id);
  }

  @Patch('conversations/:id/activate')
  async activateConversation(@Param('id') id: string): Promise<void> {
    return this.conversationService.activateConversation(id);
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { MessageService } from '../../application/services/message.service';
import { SendMessageDto } from '../../application/dto/message.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  serviceId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly messageService: MessageService) {}

  handleConnection(socket: AuthenticatedSocket): void {
    try {
      const token =
        (socket.handshake.query.token as string) ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        socket.disconnect();
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        socket.disconnect();
        return;
      }

      const decoded = verify(token, jwtSecret) as any;
      socket.userId = decoded.sub;

      this.logger.log(`User connected: ${socket.userId} (${socket.id})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    this.logger.log(`User disconnected: ${socket.userId} (${socket.id})`);
  }

  @SubscribeMessage('join-service')
  handleJoinService(
    socket: AuthenticatedSocket,
    payload: { serviceId: string },
  ): void {
    if (!socket.userId || !payload.serviceId) {
      socket.emit('error', { message: 'Unauthorized or invalid service' });
      return;
    }

    socket.serviceId = payload.serviceId;
    void socket.join(payload.serviceId);
    socket.to(payload.serviceId).emit('user-joined', { userId: socket.userId });
    this.logger.log(
      `User ${socket.userId} joined service ${payload.serviceId}`,
    );
  }

  @SubscribeMessage('leave-service')
  handleLeaveService(socket: AuthenticatedSocket): void {
    if (socket.serviceId) {
      void socket.leave(socket.serviceId);
      socket.to(socket.serviceId).emit('user-left', { userId: socket.userId });
      this.logger.log(`User ${socket.userId} left service ${socket.serviceId}`);
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    socket: AuthenticatedSocket,
    payload: SendMessageDto,
  ): Promise<void> {
    if (!socket.userId) {
      return;
    }

    try {
      const message = await this.messageService.sendMessageAsUser(
        {
          serviceId: payload.serviceId,
          recipientId: payload.recipientId,
          content: payload.content,
        },
        socket.userId,
      );

      this.server.to(payload.serviceId).emit('new-message', {
        message,
        timestamp: new Date(),
      });

      this.logger.log(
        `Message sent in service ${payload.serviceId} by user ${socket.userId}`,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('message-read')
  async handleMessageRead(
    socket: AuthenticatedSocket,
    payload: { messageId: string },
  ): Promise<void> {
    if (!socket.userId || !socket.serviceId) {
      return;
    }

    try {
      const message = await this.messageService.markAsReadForUser(
        payload.messageId,
        socket.userId,
      );

      this.server.to(message.serviceId).emit('message-read-update', {
        messageId: payload.messageId,
        readBy: socket.userId,
        timestamp: new Date(),
      });

      this.logger.log(
        `Message ${payload.messageId} marked as read by ${socket.userId}`,
      );
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
    }
  }

  @SubscribeMessage('message-delivered')
  async handleMessageDelivered(
    socket: AuthenticatedSocket,
    payload: { messageId: string },
  ): Promise<void> {
    if (!socket.userId || !socket.serviceId) {
      return;
    }

    try {
      const message = await this.messageService.markAsDeliveredForUser(
        payload.messageId,
        socket.userId,
      );

      this.server.to(message.serviceId).emit('message-delivered-update', {
        messageId: payload.messageId,
        deliveredTo: socket.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error marking message as delivered:', error);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    socket: AuthenticatedSocket,
    payload: { isTyping: boolean },
  ): void {
    if (!socket.userId || !socket.serviceId) {
      return;
    }

    socket.to(socket.serviceId).emit('user-typing', {
      userId: socket.userId,
      isTyping: payload.isTyping,
    });
  }
}

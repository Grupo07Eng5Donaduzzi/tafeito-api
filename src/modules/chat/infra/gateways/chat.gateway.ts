/* eslint-disable */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { MessageService } from '@chat/application/services/message.service';
import { ConversationService } from '@chat/application/services/conversation.service';
import { SendMessageDto } from '@chat/application/dto/send-message.dto';
import { verify } from 'jsonwebtoken';

interface SocketData {
  userId?: string;
  serviceId?: string;
}

type ChatSocket = {
  handshake: {
    query: Record<string, unknown>;
    headers?: { authorization?: string };
  };
  data: SocketData;
  id: string;
  disconnect(): void;
  emit(event: string, payload: unknown): void;
  join(room: string): void;
  leave(room: string): void;
  to(room: string): { emit(event: string, payload: unknown): void };
};

type ChatServer = { to(room: string): { emit(event: string, payload: unknown): void } };

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: ChatServer;

  private readonly logger = new Logger(ChatGateway.name);

  // Manutenção de conexões por serviço
  private serviceConnections: Map<string, Set<string>> = new Map();

  constructor(
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  handleConnection(socket: ChatSocket) {
    try {
      const handshakeQuery = socket.handshake.query as Record<string, unknown> | undefined;
      const queryToken =
        handshakeQuery && typeof handshakeQuery.token === 'string'
          ? handshakeQuery.token
          : undefined;
      const authHeader = socket.handshake.headers?.authorization;
      const bearerToken = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined;
      const token = queryToken || bearerToken;

      if (!token) {
        socket.disconnect();
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        socket.disconnect();
        return;
      }

      const decoded = verify(token, jwtSecret);
      const userId =
        typeof decoded === 'object' && decoded !== null && 'sub' in decoded
          ? decoded.sub
          : undefined;

      if (!userId) {
        socket.disconnect();
        return;
      }

      socket.data.userId = userId;
      this.logger.log(`User connected: ${userId} (socket: ${socket.id})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: ChatSocket) {
    const userData = socket.data;
    if (userData.userId && userData.serviceId) {
      this.removeFromServiceConnections(userData.serviceId, socket.id);
      this.server.to(userData.serviceId).emit('user-left', { userId: userData.userId });
    }

    this.logger.log(`User disconnected: ${userData.userId}`);
  }

  @SubscribeMessage('join-service')
  handleJoinService(socket: ChatSocket, payload: { serviceId: string }): void {
    const userData = socket.data;
    const userId = userData.userId;

    if (!userId || !payload.serviceId) {
      return;
    }

    userData.serviceId = payload.serviceId;
    this.addToServiceConnections(payload.serviceId, socket.id);

    // Juntar o socket à sala do serviço
    socket.join(payload.serviceId);

    this.logger.log(`User ${userId} joined service ${payload.serviceId}`);

    // Notificar outros usuários
    socket.to(payload.serviceId).emit('user-joined', { userId });
  }

  @SubscribeMessage('leave-service')
  handleLeaveService(socket: ChatSocket): void {
    const userData = socket.data;
    if (userData.serviceId) {
      this.removeFromServiceConnections(userData.serviceId, socket.id);
      socket.leave(userData.serviceId);

      this.server
        .to(userData.serviceId)
        .emit('user-left', { userId: userData.userId });

      this.logger.log(
        `User ${userData.userId} left service ${userData.serviceId}`,
      );
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(socket: ChatSocket, payload: SendMessageDto): Promise<void> {
    const userData = socket.data;

    if (!userData.userId) {
      return;
    }

    try {
      // Validar que o sender é o usuário conectado
      if (payload.senderId !== userData.userId) {
        this.logger.warn(
          `Unauthorized send attempt: ${userData.userId} tried to send as ${payload.senderId}`,
        );
        return;
      }

      // Enviar a mensagem via serviço
      const message = await this.messageService.sendMessage(payload);

      // Emitir para todos os usuários na conversa do serviço
      this.server.to(payload.serviceId).emit('new-message', {
        message,
        timestamp: new Date(),
      });

      this.logger.log(
        `Message sent in service ${payload.serviceId} by user ${userData.userId}`,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('message-read')
  async handleMessageRead(socket: ChatSocket, payload: { messageId: string }): Promise<void> {
    const userData = socket.data;

    if (!userData.userId || !userData.serviceId) {
      return;
    }

    try {
      await this.messageService.markAsRead(payload.messageId);

      // Notificar todos na sala
      this.server.to(userData.serviceId).emit('message-read-update', {
        messageId: payload.messageId,
        readBy: userData.userId,
        timestamp: new Date(),
      });

      this.logger.log(
        `Message ${payload.messageId} marked as read by ${userData.userId}`,
      );
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
    }
  }

  @SubscribeMessage('message-delivered')
  async handleMessageDelivered(socket: ChatSocket, payload: { messageId: string }): Promise<void> {
    const userData = socket.data;

    if (!userData.userId || !userData.serviceId) {
      return;
    }

    try {
      await this.messageService.markAsDelivered(payload.messageId);

      this.server.to(userData.serviceId).emit('message-delivered-update', {
        messageId: payload.messageId,
        deliveredTo: userData.userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error marking message as delivered:', error);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(socket: ChatSocket, payload: { isTyping: boolean }): void {
    const userData = socket.data;

    if (!userData.userId || !userData.serviceId) {
      return;
    }

    socket.to(userData.serviceId).emit('user-typing', {
      userId: userData.userId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('get-conversations')
  async handleGetConversations(socket: ChatSocket, payload: { serviceId: string }): Promise<void> {
    try {
      const conversations = await this.conversationService.getServiceConversations(
        payload.serviceId,
      );
      socket.emit('conversations-list', { conversations });
    } catch (error) {
      this.logger.error('Error fetching conversations:', error);
      socket.emit('error', { message: 'Failed to fetch conversations' });
    }
  }

  @SubscribeMessage('get-messages')
  async handleGetMessages(socket: ChatSocket, payload: { serviceId: string; page?: number; pageSize?: number }): Promise<void> {
    try {
      const messages = await this.messageService.getServiceMessages(
        payload.serviceId,
        payload.page || 1,
        payload.pageSize || 50,
      );
      socket.emit('messages-list', { messages });
    } catch (error) {
      this.logger.error('Error fetching messages:', error);
      socket.emit('error', { message: 'Failed to fetch messages' });
    }
  }

  // Métodos auxiliares privados

  private addToServiceConnections(serviceId: string, socketId: string): void {
    if (!this.serviceConnections.has(serviceId)) {
      this.serviceConnections.set(serviceId, new Set());
    }
    this.serviceConnections.get(serviceId)!.add(socketId);
  }

  private removeFromServiceConnections(serviceId: string, socketId: string): void {
    const connections = this.serviceConnections.get(serviceId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.serviceConnections.delete(serviceId);
      }
    }
  }

  getActiveConnectionsCount(serviceId: string): number {
    return this.serviceConnections.get(serviceId)?.size || 0;
  }
}

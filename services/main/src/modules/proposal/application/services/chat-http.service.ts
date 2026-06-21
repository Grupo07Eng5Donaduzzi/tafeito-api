import { Injectable, Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class ChatHttpService {
  private readonly logger = new Logger(ChatHttpService.name);
  private readonly chatServiceUrl: string;

  constructor() {
    this.chatServiceUrl = process.env.CHAT_SERVICE_URL ?? 'http://localhost:4002';
  }

  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    return jwt.sign({ sub: userId }, secret, { expiresIn: '1m' });
  }

  async ensureConversation(
    initiatorId: string,
    participantId: string,
  ): Promise<{ conversationId: string; isNew: boolean }> {
    const token = this.generateToken(initiatorId);
    const res = await fetch(`${this.chatServiceUrl}/chat/conversations/ensure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ participantId }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Chat service ensureConversation failed (${res.status}): ${body}`);
    }
    return res.json() as Promise<{ conversationId: string; isNew: boolean }>;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string,
  ): Promise<void> {
    const token = this.generateToken(senderId);
    const res = await fetch(
      `${this.chatServiceUrl}/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId, content }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      this.logger.warn(
        `Failed to send automatic message to conversation ${conversationId} (${res.status}): ${body}`,
      );
    }
  }
}

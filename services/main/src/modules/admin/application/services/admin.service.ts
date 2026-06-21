import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { eq, desc, asc, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';
import {
  proposalsSchema,
} from '../../../proposal/infra/schemas/proposal.schema';
import {
  adminsSchema,
  adminAuditLogsSchema,
  chatConversationsSchema,
  chatMessagesSchema,
} from '../../infra/schemas/admin.schema';
import { ChatDrizzleService } from '../../infra/database/chat-drizzle.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly chatDrizzle: ChatDrizzleService,
  ) {}

  async listUsers() {
    const rows = await this.drizzleService.db
      .select({
        id: usersSchema.id,
        name: usersSchema.name,
        email: usersSchema.email,
        identification: usersSchema.identification,
        pixKey: usersSchema.pixKey,
        avatarUrl: usersSchema.avatarUrl,
        status: usersSchema.status,
        createdAt: usersSchema.createdAt,
      })
      .from(usersSchema)
      .orderBy(asc(usersSchema.createdAt));

    return rows.map((r) => ({
      ...r,
      isProvider: !!r.pixKey,
    }));
  }

  async setUserStatus(id: string, status: 'active' | 'suspended') {
    const [user] = await this.drizzleService.db
      .select({ id: usersSchema.id })
      .from(usersSchema)
      .where(eq(usersSchema.id, id))
      .limit(1);

    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.drizzleService.db
      .update(usersSchema)
      .set({ status, updatedAt: new Date() })
      .where(eq(usersSchema.id, id));
  }

  async listChats() {
    const conversations = await this.chatDrizzle.db
      .select({
        id: chatConversationsSchema.id,
        participantIds: chatConversationsSchema.participantIds,
        lastMessageAt: chatConversationsSchema.lastMessageAt,
        isActive: chatConversationsSchema.isActive,
        createdAt: chatConversationsSchema.createdAt,
      })
      .from(chatConversationsSchema)
      .orderBy(desc(chatConversationsSchema.lastMessageAt));

    const allUserIds = [...new Set(conversations.flatMap((c) => c.participantIds))];

    const users = allUserIds.length > 0
      ? await this.drizzleService.db
          .select({ id: usersSchema.id, name: usersSchema.name })
          .from(usersSchema)
          .where(inArray(usersSchema.id, allUserIds))
      : [];

    const nameById = Object.fromEntries(users.map((u) => [u.id, u.name]));

    return conversations.map((c) => ({
      conversationId: c.id,
      participantIds: c.participantIds,
      participantNames: c.participantIds.map((id) => nameById[id] ?? id),
      lastMessageAt: c.lastMessageAt,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }));
  }

  async getChatMessages(
    conversationId: string,
    page: number = 1,
    pageSize: number = 50,
  ) {
    const offset = (page - 1) * pageSize;

    const [conv] = await this.chatDrizzle.db
      .select({ id: chatConversationsSchema.id })
      .from(chatConversationsSchema)
      .where(eq(chatConversationsSchema.id, conversationId))
      .limit(1);

    if (!conv) throw new NotFoundException('Conversa não encontrada');

    const messages = await this.chatDrizzle.db
      .select()
      .from(chatMessagesSchema)
      .where(eq(chatMessagesSchema.conversationId, conversationId))
      .orderBy(asc(chatMessagesSchema.createdAt))
      .limit(pageSize)
      .offset(offset);

    return messages;
  }

  async listPayments() {
    const clientUser = alias(usersSchema, 'pay_client_user');
    const providerUser = alias(usersSchema, 'pay_provider_user');

    const rows = await this.drizzleService.db
      .select({
        id: proposalsSchema.id,
        clientName: clientUser.name,
        providerName: providerUser.name,
        amount: proposalsSchema.amount,
        status: proposalsSchema.status,
        paymentId: proposalsSchema.paymentId,
        invoiceFile: proposalsSchema.invoiceFile,
        createdAt: proposalsSchema.createdAt,
        updatedAt: proposalsSchema.updatedAt,
      })
      .from(proposalsSchema)
      .leftJoin(clientUser, eq(proposalsSchema.clientId, clientUser.id))
      .leftJoin(providerUser, eq(proposalsSchema.providerId, providerUser.id))
      .orderBy(desc(proposalsSchema.createdAt));

    return rows;
  }

  async markPaymentPaid(proposalId: string, adminId: string) {
    const [proposal] = await this.drizzleService.db
      .select({ id: proposalsSchema.id, status: proposalsSchema.status })
      .from(proposalsSchema)
      .where(eq(proposalsSchema.id, proposalId))
      .limit(1);

    if (!proposal) throw new NotFoundException('Proposta não encontrada');

    if (proposal.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException(
        'Apenas propostas aguardando pagamento podem ser marcadas como pagas',
      );
    }

    await this.drizzleService.db
      .update(proposalsSchema)
      .set({ status: 'ACCEPTED', updatedAt: new Date() })
      .where(eq(proposalsSchema.id, proposalId));

    await this.createAuditLog({
      adminId,
      action: 'MARK_PAYMENT_PAID',
      targetType: 'payment',
      targetId: proposalId,
      description: `Pagamento da proposta ${proposalId} marcado como pago manualmente`,
    });
  }

  async refundPayment(proposalId: string, pixKey: string, adminId: string) {
    const [proposal] = await this.drizzleService.db
      .select({ id: proposalsSchema.id, status: proposalsSchema.status })
      .from(proposalsSchema)
      .where(eq(proposalsSchema.id, proposalId))
      .limit(1);

    if (!proposal) throw new NotFoundException('Proposta não encontrada');

    await this.drizzleService.db
      .update(proposalsSchema)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(proposalsSchema.id, proposalId));

    await this.createAuditLog({
      adminId,
      action: 'REFUND_PAYMENT',
      targetType: 'payment',
      targetId: proposalId,
      description: `Reembolso iniciado para proposta ${proposalId} via PIX ${pixKey}`,
      metadata: JSON.stringify({ pixKey }),
    });
  }

  async listAuditLogs() {
    const rows = await this.drizzleService.db
      .select({
        id: adminAuditLogsSchema.id,
        adminId: adminAuditLogsSchema.adminId,
        action: adminAuditLogsSchema.action,
        targetType: adminAuditLogsSchema.targetType,
        targetId: adminAuditLogsSchema.targetId,
        description: adminAuditLogsSchema.description,
        metadata: adminAuditLogsSchema.metadata,
        createdAt: adminAuditLogsSchema.createdAt,
        adminName: adminsSchema.name,
        adminEmail: adminsSchema.email,
      })
      .from(adminAuditLogsSchema)
      .leftJoin(adminsSchema, eq(adminAuditLogsSchema.adminId, adminsSchema.id))
      .orderBy(desc(adminAuditLogsSchema.createdAt));

    return rows.map((r) => ({
      ...r,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
    }));
  }

  async createAuditLog(params: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    description: string;
    metadata?: string;
  }) {
    await this.drizzleService.db.insert(adminAuditLogsSchema).values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      description: params.description,
      metadata: params.metadata ?? null,
      createdAt: new Date(),
    });
  }
}

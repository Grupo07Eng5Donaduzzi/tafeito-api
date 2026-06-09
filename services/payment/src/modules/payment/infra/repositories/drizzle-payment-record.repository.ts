import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { paymentRecordsSchema } from '../database/schemas/payment-record.schema';
import type {
  PaymentRecord,
  PaymentRecordRepository,
} from '../../domain/repositories/payment-record-repository.interface';

@Injectable()
export class DrizzlePaymentRecordRepository implements PaymentRecordRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(record: PaymentRecord): Promise<void> {
    await this.drizzleService.db.insert(paymentRecordsSchema).values({
      proposalId: record.proposalId,
      asaasPaymentId: record.asaasPaymentId,
      qrCode: record.qrCode,
      qrCodeBase64: record.qrCodeBase64,
      ticketUrl: record.ticketUrl,
      status: record.status,
      amount: record.amount.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async findByProposalId(proposalId: string): Promise<PaymentRecord | null> {
    const result = await this.drizzleService.db
      .select()
      .from(paymentRecordsSchema)
      .where(eq(paymentRecordsSchema.proposalId, proposalId))
      .limit(1);

    if (!result[0]) return null;
    return this.mapToRecord(result[0]);
  }

  async findByAsaasPaymentId(asaasPaymentId: string): Promise<PaymentRecord | null> {
    const result = await this.drizzleService.db
      .select()
      .from(paymentRecordsSchema)
      .where(eq(paymentRecordsSchema.asaasPaymentId, asaasPaymentId))
      .limit(1);

    if (!result[0]) return null;
    return this.mapToRecord(result[0]);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.drizzleService.db
      .update(paymentRecordsSchema)
      .set({ status, updatedAt: new Date() })
      .where(eq(paymentRecordsSchema.id, id));
  }

  private mapToRecord(row: any): PaymentRecord {
    return {
      id: row.id,
      proposalId: row.proposalId,
      asaasPaymentId: row.asaasPaymentId,
      qrCode: row.qrCode,
      qrCodeBase64: row.qrCodeBase64,
      ticketUrl: row.ticketUrl ?? undefined,
      status: row.status,
      amount: parseFloat(row.amount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

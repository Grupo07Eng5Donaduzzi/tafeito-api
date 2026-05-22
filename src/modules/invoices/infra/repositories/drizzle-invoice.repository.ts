import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import { Invoice } from '../../domain/models/invoice.entity';
import { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { invoicesSchema } from '../schemas/invoice.schema';

@Injectable()
export class DrizzleInvoiceRepository implements InvoiceRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(invoice: Invoice): Promise<Date> {
    const [row] = await this.drizzleService.db
      .insert(invoicesSchema)
      .values({
        id: invoice.id,
        paymentId: invoice.paymentId,
        filePath: invoice.filePath,
        fileName: invoice.fileName,
        fileType: invoice.fileType,
        fileSize: invoice.fileSize,
        uploadedBy: invoice.uploadedBy,
        createdAt: new Date(),
      })
      .returning({ createdAt: invoicesSchema.createdAt });
    return row.createdAt;
  }

  async findById(id: string): Promise<Invoice | null> {
    const result = await this.drizzleService.db
      .select()
      .from(invoicesSchema)
      .where(eq(invoicesSchema.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByPaymentId(paymentId: string): Promise<Invoice[]> {
    const result = await this.drizzleService.db
      .select()
      .from(invoicesSchema)
      .where(eq(invoicesSchema.paymentId, paymentId))
      .orderBy(invoicesSchema.createdAt);

    return result.map((row) => this.mapToEntity(row));
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(invoicesSchema)
      .where(eq(invoicesSchema.id, id));
  }

  private mapToEntity(row: typeof invoicesSchema.$inferSelect): Invoice {
    return Invoice.restore({
      id: row.id,
      paymentId: row.paymentId,
      filePath: row.filePath,
      fileName: row.fileName,
      fileType: row.fileType,
      fileSize: row.fileSize,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import { AuditLog } from '../../domain/models/audit-log.entity';
import { AuditLogRepository } from '../../domain/repositories/audit-log-repository.interface';
import { auditLogsSchema } from '../schemas/audit-log.schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class DrizzleAuditLogRepository implements AuditLogRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(auditLog: AuditLog): Promise<void> {
    await this.drizzleService.db.insert(auditLogsSchema).values({
      action: auditLog.action,
      userId: auditLog.userId,
      targetId: auditLog.targetId,
      details: auditLog.details,
      createdAt: new Date(),
    });
  }

  async findByActionAndTarget(
    action: string,
    targetId: string,
  ): Promise<AuditLog | null> {
    const result = await this.drizzleService.db
      .select()
      .from(auditLogsSchema)
      .where(
        and(
          eq(auditLogsSchema.action, action),
          eq(auditLogsSchema.targetId, targetId),
        ),
      )
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findAll(): Promise<AuditLog[]> {
    const result = await this.drizzleService.db
      .select()
      .from(auditLogsSchema)
      .orderBy(auditLogsSchema.createdAt);

    return result.map(this.mapToEntity);
  }

  private mapToEntity(row: any): AuditLog {
    return AuditLog.restore({
      id: row.id,
      action: row.action,
      userId: row.userId ?? undefined,
      targetId: row.targetId,
      details: row.details,
      createdAt: row.createdAt,
    });
  }
}

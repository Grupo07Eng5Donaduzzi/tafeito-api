import { Inject, Injectable } from '@nestjs/common';
import { AuditLog } from '../../domain/models/audit-log.entity';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogRepository,
} from '../../domain/repositories/audit-log-repository.interface';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepository: AuditLogRepository,
  ) {}

  async log(
    action: string,
    targetId: string,
    userId?: string,
    details?: any,
  ): Promise<void> {
    const auditLog = AuditLog.create({
      action,
      targetId,
      userId,
      details,
    });
    await this.auditRepository.create(auditLog);
  }

  async hasAlreadyLogged(action: string, targetId: string): Promise<boolean> {
    const existing = await this.auditRepository.findByActionAndTarget(
      action,
      targetId,
    );
    return !!existing;
  }
}

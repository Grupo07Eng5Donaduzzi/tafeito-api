import { AuditLog } from '../models/audit-log.entity';

export const AUDIT_LOG_REPOSITORY = Symbol('AuditLogRepository');

export interface AuditLogRepository {
  create(auditLog: AuditLog): Promise<void>;
  findByActionAndTarget(
    action: string,
    targetId: string,
  ): Promise<AuditLog | null>;
  findAll(): Promise<AuditLog[]>;
}

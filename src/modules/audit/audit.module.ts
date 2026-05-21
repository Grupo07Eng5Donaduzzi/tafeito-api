import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AuditService } from './application/services/audit.service';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log-repository.interface';
import { DrizzleAuditLogRepository } from './infra/repositories/drizzle-audit-log.repository';

@Module({
  imports: [SharedModule],
  providers: [
    AuditService,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: DrizzleAuditLogRepository,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}

import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ServiceService } from './application/services/service.service';
import { ServicesController } from './infra/controllers/services.controller';
import { DrizzleServiceRepository } from './infra/repositories/drizzle-service.repository';
import { SERVICE_REPOSITORY } from './domain/repositories/service-repository.interface';

@Module({
  imports: [SharedModule],
  controllers: [ServicesController],
  providers: [
    ServiceService,
    DrizzleServiceRepository,
    {
      provide: SERVICE_REPOSITORY,
      useExisting: DrizzleServiceRepository,
    },
  ],
  exports: [ServiceService],
})
export class ServicosModule {}
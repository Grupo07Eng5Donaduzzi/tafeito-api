import { Module } from '@nestjs/common';
import { ServicesController } from './infra/controllers/services.controller';
import { ServiceService } from './application/services/service.service';
import { DrizzleServiceRepository } from './infra/repositories/drizzle-service.repository';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ServicesController],
  providers: [ServiceService, DrizzleServiceRepository],
  exports: [ServiceService],
})
export class ServicesModule {}

import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { RequestService } from './application/services/request.service';
import { RequestsController } from './infra/controllers/requests.controller';
import { DrizzleRequestRepository } from './infra/repositories/drizzle-request.repository';
import { REQUEST_REPOSITORY } from './domain/repositories/request-repository.interface';

@Module({
  imports: [SharedModule],
  controllers: [RequestsController],
  providers: [
    RequestService,
    DrizzleRequestRepository,
    {
      provide: REQUEST_REPOSITORY,
      useExisting: DrizzleRequestRepository,
    },
  ],
  exports: [RequestService],
})
export class PedidosModule {}
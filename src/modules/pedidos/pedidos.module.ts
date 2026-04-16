import { RequestService } from "@pedidos/application/services/request.service";
import { REQUEST_REPOSITORY } from "@pedidos/domain/repositories/request-repository.interface";
import { RequestsController } from "@pedidos/infra/controllers/requests.controller";
import { DrizzleRequestRepository } from "@pedidos/infra/repositories/drizzle-request.repository";
import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";

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
export class PedidosModule { }
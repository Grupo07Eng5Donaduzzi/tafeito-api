import { ServiceService } from "@servicos/application/services/service.service";
import { SERVICE_REPOSITORY } from "@servicos/domain/repositories/service-repository.interface";
import { ServicesController } from "@servicos/infra/controllers/services.controller";
import { DrizzleServiceRepository } from "@servicos/infra/repositories/drizzle-service.repository";
import { Module } from "@nestjs/common";
import { SharedModule } from "@shared/shared.module";

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
export class ServicosModule { }
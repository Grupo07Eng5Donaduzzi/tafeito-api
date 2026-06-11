import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DrizzleService } from './infra/database/drizzle.service';
import { HateoasInterceptor } from './infra/hateoas/hateoas.interceptor';
import { RabbitMQService } from './infra/messaging/rabbitmq.service';
import { SharedMessagingService } from './infra/messaging/shared-messaging.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    DrizzleService,
    RabbitMQService,
    SharedMessagingService,
    { provide: APP_INTERCEPTOR, useClass: HateoasInterceptor },
  ],
  exports: [DrizzleService, RabbitMQService, SharedMessagingService],
})
export class SharedModule {}

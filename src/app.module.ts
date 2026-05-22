import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    SharedModule,
    UsersModule,
    AuthModule,
    ServicesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

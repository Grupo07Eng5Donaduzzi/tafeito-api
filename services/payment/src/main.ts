import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

void bootstrapHttpApp(AppModule, {
  title: 'Tafeito Payment API',
  description: 'Microsserviço de pagamentos PIX via Asaas.',
  port: process.env.PORT ?? 4002,
});

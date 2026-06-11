import 'reflect-metadata';
import { bootstrapHttpApp } from '@shared/infra/http/bootstrap-http-app';
import { AppModule } from './app.module';

void bootstrapHttpApp(AppModule, {
  title: 'Tafeito Chat API',
  description: 'Microsserviço de conversas e mensagens em tempo real.',
  port: process.env.PORT ?? 4003,
});

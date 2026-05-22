import 'dotenv/config';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const httpsOptions = isProduction
    ? {
        key: fs.readFileSync(process.env.TLS_KEY_PATH!),
        cert: fs.readFileSync(process.env.TLS_CERT_PATH!),
      }
    : undefined;

  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(isProduction ? 443 : 3000);
}

void bootstrap();

import 'dotenv/config';
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined;
  if (isProduction) {
    const keyPath = process.env.TLS_KEY_PATH;
    const certPath = process.env.TLS_CERT_PATH;
    if (!keyPath || !certPath) {
      throw new Error(
        'TLS_KEY_PATH and TLS_CERT_PATH must be set when NODE_ENV=production',
      );
    }
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.use(helmet());

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error('FRONTEND_URL must be set');
  }
  app.enableCors({
    origin: frontendUrl,
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

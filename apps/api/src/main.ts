import { mkdirSync } from 'node:fs';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import csrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));
  const config = app.get(ConfigService);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie);
  await app.register(csrf, { cookieOpts: { sameSite: 'strict', httpOnly: true, secure: config.get('NODE_ENV') === 'production' } });
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });
  const uploadDir = config.get<string>('UPLOAD_DIR', '/app/uploads');
  mkdirSync(uploadDir, { recursive: true });
  await app.register(staticFiles, { root: uploadDir, prefix: '/v1/uploads/', decorateReply: false });
  app.enableCors({ origin: config.get('CORS_ORIGIN')?.split(',') ?? true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('v1');
  const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('TOLONG API').setDescription('DPD PSI Mesuji Lampung civic super app API').setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('docs', app, doc);
  await app.listen(config.get<number>('PORT', 3001), '0.0.0.0');
}
bootstrap();

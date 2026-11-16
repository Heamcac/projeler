import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import session = require('express-session');
import helmet from 'helmet';
import csurf = require('csurf');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const secureCookie = process.env.COOKIE_SECURE === 'true';

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.use(cookieParser());
  app.use(
    session({
      name: 'hospion.sid',
      secret: process.env.SESSION_SECRET ?? 'dev-only-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: secureCookie,
        sameSite: secureCookie ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 8,
      },
    }),
  );
  app.use(csurf({ cookie: false, ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(Number(process.env.API_PORT ?? 4000));
}

void bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix - all routes become /api/*
  app.setGlobalPrefix('api');


  // === SECURITY MIDDLEWARE ===
  
  // 1. Helmet - Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // 2. Rate limiting — relaxed for local development
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Auth rate limit — also relaxed for local dev
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    skipSuccessfulRequests: true,
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // 3. Data sanitization - prevent NoSQL injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }: { req: any; key: string }) => {
      console.warn(`Potential injection attempt detected in ${key}`);
    },
  }));

  // 4. Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // 5. Enable CORS with strict restrictions
  app.enableCors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(url => url.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 SERENVI Backend is running on http://localhost:${port}`);
  console.log(`🔒 Security features enabled: Helmet, Rate Limiting, Input Sanitization`);
}

bootstrap();

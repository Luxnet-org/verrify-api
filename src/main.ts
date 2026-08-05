import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionFilter } from './exception/all-exception.filter';
import AppConstants from './utility/app-constants';
import { corsOptions } from './config/cors-oprions.config';
import { Express } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const expressApp = app.getHttpAdapter().getInstance() as Express;
  // Caddy is the only HTTP proxy. Docker bridge/NAT does not add another
  // forwarded-address entry, so one trusted hop resolves request.ip correctly.
  expressApp.set('trust proxy', 1);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionFilter(httpAdapter));
  app.setGlobalPrefix(AppConstants.APP_GLOBAL_PREFIX);
  app.enableCors(corsOptions);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerOptions = new DocumentBuilder()
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', // Optional: add if you are using JWT
      },
      'access-token',
    )
    .setTitle('VERRIFY API Docs')
    .setDescription('Swagger Docs for VERRIFY')
    .setVersion('1.0')
    .addTag('VERRIFY Api')
    .addServer('http://localhost:3000', 'Local environment')
    .addServer('', 'Server environment')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  document.security = [{ 'access-token': [] }];
  SwaggerModule.setup(`/docs`, app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

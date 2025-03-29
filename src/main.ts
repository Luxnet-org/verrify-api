import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionFilter } from './all-exception.filter';
import AppConstants from './utility/app-constants';
import { corsOptions } from './config/cors-oprions.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
bootstrap();

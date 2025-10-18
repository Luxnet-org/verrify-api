import { Module } from '@nestjs/common';
import { MyLoggerService } from './service/logger/my-logger.service';
import { MyConfigModule } from './config-module/config.module';
import { RabbitMQService } from './service/rabbitmq/rabbitmq.service';
import { EmailService } from './service/email/email.service';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from './config-module/configuration';
import { JwtModule } from '@nestjs/jwt';
import { CustomJwtService } from './service/token/jwt.service';
import { TokenService } from './service/token/token.service';
import { AuthService } from './service/auth/auth.service';
import { UserService } from './service/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';
import { RoleGuard } from './common/guards/role.guard';
import { User } from './model/entity/user.entity';
import { LocationEntity } from './model/entity/location.entity';
import { Token } from './model/entity/token.entity';
import { FileEntity } from './model/entity/file.entity';
import { Verification } from './model/entity/verification.entity';
import { RbacService } from './service/rbac/rbac.service';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { VerificationService } from './service/verification/verification.service';
import { EmailEvent } from './service/email/email-event.service';
import { AuthController } from './controller/auth.controller';
import { FileService } from './service/file/file.service';
import { CloudinaryProvider } from './service/file/cloudinary.provider';
import { FileController } from './controller/file.controller';
import { UserController } from './controller/user.controller';
import { StayAlive } from './service/stayAlive/stay-alive.service';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { Company } from './model/entity/company.entity';
import { CompanyService } from './service/company/company.service';
import { CompanyController } from './controller/company.controller';
import { Property } from './model/entity/property.entity';
import { PropertyController } from './controller/property.controller';
import { PropertyService } from './service/property/property.service';
import { ArticleService } from './service/article/article.service';
import { Article } from './model/entity/article.entity';
import { ArticleController } from './controller/article.controller';
import { ContactUsService } from './service/contact-us/contact-us.service';
import { ContactUsController } from './controller/contact-us.controller';
import { ContactEventService } from './service/contact-us/contact-event.service';
import { NewsletterService } from './service/contact-us/newsletter.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigInterface>) => {
        const appConfig = configService.get('app', { infer: true });
        const databaseConfig = configService.get('database', { infer: true });

        if (!appConfig || !databaseConfig) {
          throw new Error(
            'Missing configuration for app or database. Check configuration.ts and .env settings.',
          );
        }

        return {
          type: 'postgres',
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.name,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: appConfig.env === 'dev',
          autoLoadEntities: true,
          logging: appConfig.env === 'dev',
          timezone: 'Z',
          ssl: appConfig.env === 'prod' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigInterface>) => {
        const token = configService.get('token', { infer: true });
        if (!token) {
          throw new Error(
            'Missing configuration for jwt. Check configuration.ts and .env settings.',
          );
        }
        return {
          secret: token.secret,
          signOptions: {
            expiresIn: token.jwtExpire,
          },
        };
      },
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<ConfigInterface>,
      ): MailerOptions => {
        const emailConfig = configService.get('email', { infer: true });
        const appConfig = configService.get('app', { infer: true });
        if (!emailConfig) {
          throw new Error(
            'Missing configuration for app or database. Check configuration.ts and .env settings.',
          );
        }
        return {
          transport: {
            host: emailConfig.host,
            port: emailConfig.port,
            secure: false,
            auth: {
              user: emailConfig.username,
              pass: emailConfig.password,
            },
            requireTLS: true,
            logger: appConfig?.env === 'dev',
            debug: appConfig?.env === 'dev',
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: emailConfig.sender,
          },
          template: {
            dir: __dirname + '/templates',
            adapter: new PugAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    MyConfigModule,
    TypeOrmModule.forFeature([
      User,
      LocationEntity,
      Token,
      FileEntity,
      Verification,
      Company,
      Property,
      Article,
    ]),
    HttpModule,
    ScheduleModule.forRoot({}),
  ],
  controllers: [
    AuthController,
    FileController,
    UserController,
    CompanyController,
    PropertyController,
    ArticleController,
    ContactUsController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    MyLoggerService,
    EmailService,
    RabbitMQService,
    TokenService,
    CustomJwtService,
    AuthService,
    UserService,
    RbacService,
    VerificationService,
    EmailEvent,
    FileService,
    CloudinaryProvider,
    FileService,
    StayAlive,
    CompanyService,
    PropertyService,
    ArticleService,
    ContactUsService,
    ContactEventService,
    NewsletterService,
  ],
  exports: [RbacService],
})
export class AppModule {}

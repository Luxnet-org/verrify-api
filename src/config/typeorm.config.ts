import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: parseInt(configService.get<string>('DB_PORT')!, 5432),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  synchronize: configService.get<string>('APP_PROFILE') === 'dev',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  // migrations: ['src/database/migrations/*-migration.ts'],
  migrationsRun: false,
  logging: true,
  ssl:
    configService.get<string>('APP_PROFILE') === 'prod'
      ? { rejectUnauthorized: false }
      : false,
});

export default AppDataSource;

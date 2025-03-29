import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  configuration,
  validationSchema,
} from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: '.env',
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
})
export class MyConfigModule {}

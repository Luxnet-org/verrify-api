import {
  RabbitMQModule,
  MessageHandlerErrorBehavior,
} from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigInterface } from '../../config-module/configuration';
import { RABBITMQ_EXCHANGES } from './rabbitmq.constants';
import { RABBITMQ_QUEUES } from './rabbitmq.config';
import { RabbitMQRetryService } from './rabbitmq-retry.service';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigInterface>) => ({
        uri: configService.getOrThrow('queue.rabbitMQUri', {
          infer: true,
        }),
        exchanges: Object.values(RABBITMQ_EXCHANGES).map((name) => ({
          name,
          type: 'topic',
          options: {
            durable: true,
          },
        })),
        queues: RABBITMQ_QUEUES,
        connectionInitOptions: {
          wait: false,
        },
        connectionManagerOptions: {
          heartbeatIntervalInSeconds: 5,
          reconnectTimeInSeconds: 5,
        },
        defaultPublishOptions: {
          persistent: true,
        },
        defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
        prefetchCount: 10,
      }),
    }),
  ],
  providers: [RabbitMQRetryService],
  exports: [RabbitMQModule, RabbitMQRetryService],
})
export class VerrifyRabbitMQModule {}

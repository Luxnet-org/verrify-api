import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from 'src/config-module/configuration';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import * as amqplib from 'amqplib';

export interface QueueConfig {
  name: string;
  routingKey: string;
  handler: (data: any) => Promise<void> | void;
}

export interface RabbitMQConfig {
  queues: QueueConfig[];
  retryExchange: string;
  queueExchange: string;
  deadLetterExchange: string;
  maxRetryAttempt: number;
  retryDelayMs: number;
}

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private rabbitMQConfig: RabbitMQConfig = {
    queues: [],
    retryExchange: 'aiemrRetryExchange',
    queueExchange: 'aiemrQueueExchange',
    deadLetterExchange: 'aiemrEmailDeadLetterQueue',
    maxRetryAttempt: 5,
    retryDelayMs: 10000,
  };

  private readonly logger: MyLoggerService = new MyLoggerService(
    RabbitMQService.name,
  );
  private channel: amqplib.Channel;
  private connection: amqplib.Connection;

  constructor(private readonly configService: ConfigService<ConfigInterface>) {}

  async onModuleInit() {
    try {
      this.connection = await amqplib.connect(
        this.configService.get('queue.rabbitMQUri', { infer: true }),
      );
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(
        this.rabbitMQConfig.queueExchange,
        'topic',
        {
          durable: true,
        },
      );
      await this.channel.assertExchange(
        this.rabbitMQConfig.retryExchange,
        'topic',
        {
          durable: true,
        },
      );
      await this.channel.assertExchange(
        this.rabbitMQConfig.deadLetterExchange,
        'topic',
        {
          durable: true,
        },
      );

      for (const queue of this.rabbitMQConfig.queues) {
        await this.configureQueue(queue);
        await this.consumeQueue(queue.name, queue.routingKey, queue.handler);
      }
    } catch (error) {
      this.logger.log(
        `Failed to configure RabbitMQ queues: ${error.message}`,
        RabbitMQService.name,
      );
    }
  }

  private async configureQueue(queue: QueueConfig): Promise<void> {
    const { name, routingKey }: QueueConfig = queue;
    const queueName = `${name}_nest_queue`;
    const retryQueueName = `${name}_nest_retry_queue`;
    const deadLetterQueueName = `${name}_dead_letter_queue`;

    await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': this.rabbitMQConfig.retryExchange,
        'x-dead-letter-routing-key': routingKey,
      },
    });

    await this.channel.assertQueue(retryQueueName, {
      durable: true,
      arguments: {
        'x-message-ttl': this.rabbitMQConfig.retryDelayMs,
        'x-dead-letter-exchange': this.rabbitMQConfig.queueExchange,
        'x-dead-letter-routing-key': routingKey,
      },
    });

    await this.channel.assertQueue(deadLetterQueueName, {
      durable: true,
    });

    await this.channel.bindQueue(
      queueName,
      this.rabbitMQConfig.queueExchange,
      routingKey,
    );

    await this.channel.bindQueue(
      retryQueueName,
      this.rabbitMQConfig.retryExchange,
      routingKey,
    );

    await this.channel.bindQueue(
      deadLetterQueueName,
      this.rabbitMQConfig.deadLetterExchange,
      routingKey,
    );
  }

  async addQueue(config: QueueConfig): Promise<void> {
    this.rabbitMQConfig.queues.push(config);
  }

  async addToQueue(routingKey: string, data: any) {
    try {
      this.channel.publish(
        this.rabbitMQConfig.queueExchange,
        routingKey,
        Buffer.from(JSON.stringify(data)),
      );
      this.logger.log(`Email request published`, RabbitMQService.name);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to publish email request: ${error.message}`,
        RabbitMQService.name,
      );
      throw error;
    }
  }

  private async consumeQueue(
    queueName: string,
    routingKey: string,
    callback: (data: any) => Promise<void> | void,
  ) {
    await this.channel.consume(
      `${queueName}_nest_queue`,
      async (msg) => {
        if (!msg) return;

        try {
          const data = JSON.parse(msg.content.toString());
          this.logger.log(`Processing email`, RabbitMQService.name);

          await callback(data);
          this.channel.ack(msg);
          this.logger.log(`Email processed successfully`, RabbitMQService.name);
        } catch (error) {
          let retryCount = 0;
          const xDeath: amqplib.XDeath[] | undefined =
            msg.properties.headers?.['x-death'];
          if (xDeath && xDeath.length > 0) {
            retryCount = xDeath[0].count;
          }

          if (retryCount < this.rabbitMQConfig.maxRetryAttempt) {
            this.channel.reject(msg, false);
            this.logger.warn(
              `Email processing failed, sending to retry queue. Attempt ${retryCount + 1} of ${this.rabbitMQConfig.maxRetryAttempt}`,
              RabbitMQService.name,
            );
          } else {
            this.channel.ack(msg);
            this.logger.error(
              `Max retries reached for email, sending to dead letter queue: ${error.message}`,
              RabbitMQService.name,
            );

            this.channel.publish(
              this.rabbitMQConfig.deadLetterExchange,
              routingKey,
              msg.content,
              {
                persistent: true,
                headers: msg.properties.headers,
              },
            );
          }
        }
      },
      { noAck: false },
    );

    this.logger.log('Email consumer started', RabbitMQService.name);
  }
}

import { ConsumeMessage } from 'amqplib';

interface RabbitMQDeathRecord {
  count?: number;
  queue?: string;
  reason?: string;
}

export const getRejectedRetryCount = (
  message: ConsumeMessage,
  queueName: string,
): number => {
  const deathRecords = message.properties.headers?.['x-death'];

  if (!Array.isArray(deathRecords)) {
    return 0;
  }

  const rejectedRecord = (deathRecords as RabbitMQDeathRecord[]).find(
    (record) => record.queue === queueName && record.reason === 'rejected',
  );

  return typeof rejectedRecord?.count === 'number' ? rejectedRecord.count : 0;
};

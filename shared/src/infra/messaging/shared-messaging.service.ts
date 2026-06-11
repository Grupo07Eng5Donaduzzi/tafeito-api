import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class SharedMessagingService {
  private readonly logger = new Logger(SharedMessagingService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async assertExchange(name: string, type = 'direct'): Promise<void> {
    const channel = this.rabbitMQService.getChannel();
    await channel.assertExchange(name, type, { durable: true });
  }

  async publish(exchangeName: string, routingKey: string, payload: unknown): Promise<void> {
    const channel = this.rabbitMQService.getChannel();

    channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: 'application/json' },
    );

    this.logger.log(
      `Published to exchange "${exchangeName}" with routing key "${routingKey}"`,
    );
  }

  async consume(
    exchangeName: string,
    routingKey: string,
    queueName: string,
    handler: (payload: unknown) => Promise<void>,
  ): Promise<void> {
    const channel = await this.rabbitMQService.createChannel();

    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, routingKey);

    channel.prefetch(1);

    await channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString()) as unknown;
        await handler(payload);
        channel.ack(msg);
      } catch (err) {
        this.logger.error(`Error processing message from queue "${queueName}":`, err);
        channel.nack(msg, false, false);
      }
    });

    this.logger.log(`Consuming queue "${queueName}" bound to exchange "${exchangeName}"`);
  }
}

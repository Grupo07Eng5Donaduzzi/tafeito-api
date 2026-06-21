import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';
import { RabbitMQService } from './rabbitmq.service';

type RpcResponse<T> = { ok: true; data: T } | { ok: false; error: string };

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

  async request<TResponse>(
    exchangeName: string,
    routingKey: string,
    payload: unknown,
    timeoutMs = 10_000,
  ): Promise<TResponse> {
    const channel = await this.rabbitMQService.createChannel();

    try {
      await channel.assertExchange(exchangeName, 'direct', { durable: true });
      const { queue } = await channel.assertQueue('', {
        exclusive: true,
        autoDelete: true,
      });
      const correlationId = randomUUID();

      return await new Promise<TResponse>((resolve, reject) => {
        let settled = false;
        const finish = (callback: () => void): void => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          callback();
        };
        const timeout = setTimeout(() => {
          finish(() => reject(new Error(`RabbitMQ request timed out after ${timeoutMs}ms`)));
        }, timeoutMs);

        void channel
          .consume(
            queue,
            (message: ConsumeMessage | null) => {
              if (!message || message.properties.correlationId !== correlationId) return;

              try {
                const response = JSON.parse(message.content.toString()) as RpcResponse<TResponse>;
                if (response.ok) {
                  finish(() => resolve(response.data));
                } else {
                  finish(() => reject(new Error(response.error)));
                }
              } catch (err) {
                finish(() => reject(err));
              }
            },
            { noAck: true },
          )
          .then(() => {
            channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(payload)), {
              persistent: true,
              contentType: 'application/json',
              correlationId,
              replyTo: queue,
            });
          })
          .catch((err: unknown) => finish(() => reject(err)));
      });
    } finally {
      await channel.close().catch(() => undefined);
    }
  }

  async respond<TResponse>(
    exchangeName: string,
    routingKey: string,
    queueName: string,
    handler: (payload: unknown) => Promise<TResponse>,
  ): Promise<void> {
    const channel = await this.rabbitMQService.createChannel();

    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchangeName, routingKey);
    channel.prefetch(1);

    await channel.consume(queueName, async (message: ConsumeMessage | null) => {
      if (!message) return;

      let response: RpcResponse<TResponse>;
      try {
        const payload = JSON.parse(message.content.toString()) as unknown;
        response = { ok: true, data: await handler(payload) };
      } catch (err) {
        response = {
          ok: false,
          error: err instanceof Error ? err.message : 'Unknown RabbitMQ handler error',
        };
        this.logger.error(`Error processing RPC message from queue "${queueName}":`, err);
      }

      const { replyTo, correlationId } = message.properties;
      if (replyTo) {
        try {
          channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
            correlationId,
            contentType: 'application/json',
          });
        } catch (err) {
          this.logger.error(`Could not reply to RPC message from queue "${queueName}":`, err);
        }
      } else {
        this.logger.warn(`RPC message from queue "${queueName}" has no replyTo property`);
      }

      channel.ack(message);
    });

    this.logger.log(`Responding to queue "${queueName}" bound to exchange "${exchangeName}"`);
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

    await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
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

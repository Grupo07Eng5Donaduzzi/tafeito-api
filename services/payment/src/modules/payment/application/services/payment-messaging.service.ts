import { Injectable, OnModuleInit } from '@nestjs/common';
import { SharedMessagingService } from '@shared/infra/messaging/shared-messaging.service';
import {
  PaymentExchangeName,
  PaymentRoutingKey,
  PaymentCreatedPayload,
  PaymentConfirmedPayload,
} from '@shared/contracts/events/payment-events.enum';

@Injectable()
export class PaymentMessagingService implements OnModuleInit {
  constructor(private readonly messagingService: SharedMessagingService) {}

  async onModuleInit(): Promise<void> {
    await this.messagingService.assertExchange(PaymentExchangeName.CREATED);
    await this.messagingService.assertExchange(PaymentExchangeName.CONFIRMED);
  }

  async publishPaymentCreated(payload: PaymentCreatedPayload): Promise<void> {
    await this.messagingService.publish(
      PaymentExchangeName.CREATED,
      PaymentRoutingKey.CREATED,
      payload,
    );
  }

  async publishPaymentConfirmed(payload: PaymentConfirmedPayload): Promise<void> {
    await this.messagingService.publish(
      PaymentExchangeName.CONFIRMED,
      PaymentRoutingKey.CONFIRMED,
      payload,
    );
  }
}

import { Module } from '@nestjs/common';
import { BudgetRequestsModule } from '../budget-requests/budget-requests.module';
import { UsersModule } from '../users/users.module';
import { ProposalService } from './application/services/proposal.service';
import { NegotiationService } from './application/services/negotiation.service';
import { ProposalMessagingService } from './application/services/proposal-messaging.service';
import { PaymentEventConsumerService } from './application/services/payment-event-consumer.service';
import { ConversationEventConsumerService } from './application/services/conversation-event-consumer.service';
import {
  ProposalsController,
  NegotiationsController,
} from './infra/controllers/proposals.controller';
import {
  DrizzleProposalRepository,
  DrizzleNegotiationMessageRepository,
} from './infra/repositories/drizzle-proposal.repository';
import {
  PROPOSAL_REPOSITORY,
  NEGOTIATION_MESSAGE_REPOSITORY,
} from './domain/repositories/proposal-repository.interface';

@Module({
  imports: [
    BudgetRequestsModule,
    UsersModule,
  ],
  controllers: [ProposalsController, NegotiationsController],
  providers: [
    ProposalService,
    NegotiationService,
    ProposalMessagingService,
    PaymentEventConsumerService,
    ConversationEventConsumerService,
    { provide: PROPOSAL_REPOSITORY, useClass: DrizzleProposalRepository },
    { provide: NEGOTIATION_MESSAGE_REPOSITORY, useClass: DrizzleNegotiationMessageRepository },
  ],
  exports: [ProposalService, NegotiationService],
})
export class ProposalModule {}

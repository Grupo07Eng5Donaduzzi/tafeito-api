import { Module } from '@nestjs/common';
import { BudgetRequestsModule } from '../budget-requests/budget-requests.module';
import { UsersModule } from '../users/users.module';
import { ChatMessagingService } from './application/services/chat-messaging.service';
import { PaymentEventConsumerService } from './application/services/payment-event-consumer.service';
import { ProposalMessagingService } from './application/services/proposal-messaging.service';
import { ProposalService } from './application/services/proposal.service';
import { PROPOSAL_REPOSITORY } from './domain/repositories/proposal-repository.interface';
import { ProposalsController } from './infra/controllers/proposals.controller';
import { DrizzleProposalRepository } from './infra/repositories/drizzle-proposal.repository';

@Module({
  imports: [
    BudgetRequestsModule,
    UsersModule,
  ],
  controllers: [ProposalsController],
  providers: [
    ProposalService,
    ProposalMessagingService,
    PaymentEventConsumerService,
    ChatMessagingService,
    { provide: PROPOSAL_REPOSITORY, useClass: DrizzleProposalRepository },
  ],
  exports: [ProposalService],
})
export class ProposalModule {}

import { Module } from '@nestjs/common';
import { BudgetRequestsModule } from '../budget-requests/budget-requests.module';
import { UsersModule } from '../users/users.module';
import { ProposalService } from './application/services/proposal.service';
import { ProposalMessagingService } from './application/services/proposal-messaging.service';
import { PaymentEventConsumerService } from './application/services/payment-event-consumer.service';
import { ChatHttpService } from './application/services/chat-http.service';
import { ProposalsController } from './infra/controllers/proposals.controller';
import { DrizzleProposalRepository } from './infra/repositories/drizzle-proposal.repository';
import { PROPOSAL_REPOSITORY } from './domain/repositories/proposal-repository.interface';

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
    ChatHttpService,
    { provide: PROPOSAL_REPOSITORY, useClass: DrizzleProposalRepository },
  ],
  exports: [ProposalService],
})
export class ProposalModule {}

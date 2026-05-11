import { Module } from '@nestjs/common';
// import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { SharedModule } from '../../shared/shared.module';
import { BudgetRequestsModule } from '../budget-requests/budget-requests.module';
import { ChatModule } from '../chat/chat.module';
import { UsersModule } from '../users/users.module';
import { ProposalService } from './application/services/proposal.service';
import { NegotiationService } from './application/services/negotiation.service';
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
    SharedModule,
    BudgetRequestsModule,
    ChatModule,
    UsersModule,
    // RabbitMQModule.forRoot({
    //   exchanges: [
    //     {
    //       name: 'tafeito.events',
    //       type: 'topic',
    //     },
    //   ],
    //   uri: process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672',
    // }),
  ],
  controllers: [ProposalsController, NegotiationsController],
  providers: [
    ProposalService,
    NegotiationService,
    {
      provide: PROPOSAL_REPOSITORY,
      useClass: DrizzleProposalRepository,
    },
    {
      provide: NEGOTIATION_MESSAGE_REPOSITORY,
      useClass: DrizzleNegotiationMessageRepository,
    },
  ],
  exports: [ProposalService, NegotiationService],
})
export class ContestacaoModule {}

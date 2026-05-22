/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../modules/services/infra/schemas/service.schema';
import { budgetRequestsSchema } from '../../../modules/budget-requests/infra/schemas/budget-request.schema';
import { messageSchema } from '../../../modules/chat/infra/schemas/message.schema';
import { conversationSchema } from '../../../modules/chat/infra/schemas/conversation.schema';
import { invoicesSchema } from '../../../modules/invoices/infra/schemas/invoice.schema';
import { reviewsSchema } from '../../../modules/reviews/infra/schemas/review.schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const schema = {
  usersSchema,
  servicesSchema,
  budgetRequestsSchema,
  messageSchema,
  conversationSchema,
  invoicesSchema,
  reviewsSchema,
};

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly pool: Pool;
  public readonly db;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

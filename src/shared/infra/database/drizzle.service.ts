import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '@services/infra/schemas/service.schema';
import { messageSchema } from '@chat/infra/schemas/message.schema';
import { conversationSchema } from '@chat/infra/schemas/conversation.schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const schema = {
  usersSchema,
  servicesSchema,
  messageSchema,
  conversationSchema,
};

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly pool: Pool;
  public readonly db: ReturnType<typeof drizzle>;

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

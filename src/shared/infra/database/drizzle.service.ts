import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../modules/services/infra/schemas/service.schema';
import { solicitacoesOrcamentoSchema } from '../../../modules/solicitacoes-orcamento/infra/schemas/solicitacao-orcamento.schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const schema = {
  usersSchema,
  servicesSchema,
  solicitacoesOrcamentoSchema,
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

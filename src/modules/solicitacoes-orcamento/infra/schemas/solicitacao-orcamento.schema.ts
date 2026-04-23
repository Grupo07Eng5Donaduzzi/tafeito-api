import { pgTable, uuid, text, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../services/infra/schemas/service.schema';

export const statusEnum = pgEnum('status_solicitacao', ['pendente', 'respondida', 'cancelada']);

export const solicitacoesOrcamentoSchema = pgTable('solicitacoes_orcamento', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .references(() => usersSchema.id)
    .notNull(),
  servicoId: uuid('servico_id')
    .references(() => servicesSchema.id)
    .notNull(),
  descricao: text('descricao').notNull(),
  dataSolicitacao: timestamp('data_solicitacao', { withTimezone: true }).notNull(),
  status: statusEnum('status').notNull().default('pendente'),
  fotos: jsonb('fotos'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});


# Performance Design — tafeito-api

**Date:** 2026-05-26
**Scope:** Paginação em endpoints de lista + índices de banco de dados

---

## Contexto

NestJS REST API com Drizzle ORM + PostgreSQL. Atualmente:
- Reviews tem paginação (`page/pageSize` → `{ data, total, page, pageSize, hasMore }`)
- Chat/mensagens tem paginação
- Todos os outros endpoints de lista retornam SELECT * sem LIMIT
- FK columns usadas em WHERE não têm índices explícitos

---

## Arquitetura

Duas partes independentes executadas na mesma branch `feat/performance`:

1. **Índices** — migration SQL + atualizar schemas Drizzle para declarar os índices
2. **Paginação** — `PaginationQueryDto` compartilhado + atualizar 6 endpoints (repository → service → controller)

Padrão de paginação segue reviews: query params `?page=1&pageSize=20`, resposta `{ data: T[], total: number, page: number, pageSize: number, hasMore: boolean }`.

---

## Parte 1 — Índices

### Migration `0013_performance_indexes.sql`

```sql
CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);
CREATE INDEX IF NOT EXISTS budget_requests_user_id_idx ON budget_requests(user_id);
CREATE INDEX IF NOT EXISTS budget_requests_service_id_status_idx ON budget_requests(service_id, status);
CREATE INDEX IF NOT EXISTS proposals_request_id_idx ON proposals(request_id);
CREATE INDEX IF NOT EXISTS proposals_provider_id_idx ON proposals(provider_id);
CREATE INDEX IF NOT EXISTS proposals_client_id_idx ON proposals(client_id);
CREATE INDEX IF NOT EXISTS negotiation_messages_proposal_id_idx ON negotiation_messages(proposal_id);
```

### Schemas Drizzle atualizados

Cada schema recebe declaração de `index()` para manter o schema em sync com o banco.

**`src/modules/services/infra/schemas/service.schema.ts`** — adicionar `index` import + `(table) => ({ categoryIdx: index('services_category_idx').on(table.category) })`

**`src/modules/budget-requests/infra/schemas/budget-request.schema.ts`** — adicionar `index` + `userIdIdx`, `serviceIdStatusIdx`

**`src/modules/proposal/infra/schemas/proposal.schema.ts`** — adicionar `index` + `requestIdIdx`, `providerIdIdx`, `clientIdIdx` em `proposalsSchema`; `proposalIdIdx` em `negotiationMessagesSchema`

---

## Parte 2 — Paginação

### DTO compartilhado

**`src/shared/application/dto/pagination-query.dto.ts`** (arquivo novo):

```typescript
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
```

### Tipo de resposta genérico

**`src/shared/application/dto/paginated-response.dto.ts`** (arquivo novo):

```typescript
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

### Endpoints paginados

| Endpoint | Repository method | Mudança |
|---|---|---|
| `GET /services` | `findAll(page, pageSize)` | + `.limit().offset()` + `count()` |
| `GET /services?category=X` | `findByCategory(category, page, pageSize)` | idem |
| `GET /budget-requests/user/:userId` | `findByUserId(userId, page, pageSize)` | idem |
| `GET /proposals/provider/created` | `findByProviderId(id, page, pageSize)` | idem |
| `GET /proposals/client/requested` | `findByClientId(id, page, pageSize)` | idem |
| `GET /negotiations/:proposalId/messages` | `findByProposalId(id, page, pageSize)` | idem |

Cada repository method retorna `{ data: T[], total: number }`. Service monta `PaginatedResponseDto`. Controller injeta `@Query() query: PaginationQueryDto`.

---

## Arquivos alterados

| Arquivo | Operação |
|---|---|
| `drizzle/0013_performance_indexes.sql` | Criar |
| `drizzle/meta/_journal.json` | Atualizar |
| `src/shared/application/dto/pagination-query.dto.ts` | Criar |
| `src/shared/application/dto/paginated-response.dto.ts` | Criar |
| `src/modules/services/infra/schemas/service.schema.ts` | Modificar |
| `src/modules/services/infra/repositories/drizzle-service.repository.ts` | Modificar |
| `src/modules/services/application/services/service.service.ts` | Modificar |
| `src/modules/services/infra/controllers/services.controller.ts` | Modificar |
| `src/modules/budget-requests/infra/schemas/budget-request.schema.ts` | Modificar |
| `src/modules/budget-requests/infra/repositories/drizzle-budget-request.repository.ts` | Modificar |
| `src/modules/budget-requests/application/services/budget-request.service.ts` | Modificar |
| `src/modules/budget-requests/infra/controllers/budget-requests.controller.ts` | Modificar |
| `src/modules/proposal/infra/schemas/proposal.schema.ts` | Modificar |
| `src/modules/proposal/infra/repositories/drizzle-proposal.repository.ts` | Modificar |
| `src/modules/proposal/application/services/proposal.service.ts` | Modificar |
| `src/modules/proposal/application/services/negotiation.service.ts` | Modificar |
| `src/modules/proposal/infra/controllers/proposals.controller.ts` | Modificar |

---

## Fora de escopo

- `GET /users` (endpoint admin, não exposto ao cliente)
- `GET /budget-requests` sem filtro (admin)
- `GET /proposals?requestId=X` (poucos resultados por design — 1 proposta por provider/request)
- `GET /budget-requests/available?serviceId=X` (naturalmente pequeno — só pending)

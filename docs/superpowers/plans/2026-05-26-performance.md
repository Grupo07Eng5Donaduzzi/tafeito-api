# Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar índices de banco de dados nas colunas de filtro e paginar 6 endpoints de lista que atualmente retornam SELECT * sem LIMIT.

**Architecture:** 6 tasks independentes com commits atômicos. Task 1 cria DTOs compartilhados. Task 2 cria a migration de índices + atualiza schemas Drizzle. Tasks 3–6 paginam um módulo por vez (repository → service → controller). Padrão `{ data, total, page, pageSize, hasMore }` seguindo reviews.

**Tech Stack:** NestJS v11, Drizzle ORM, PostgreSQL, class-validator, class-transformer

---

### Task 1: DTOs compartilhados de paginação

**Files:**
- Create: `src/shared/application/dto/pagination-query.dto.ts`
- Create: `src/shared/application/dto/paginated-response.dto.ts`

- [ ] **Step 1: Criar `src/shared/application/dto/pagination-query.dto.ts`**

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

- [ ] **Step 2: Criar `src/shared/application/dto/paginated-response.dto.ts`**

```typescript
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;

  static of<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
  ): PaginatedResponseDto<T> {
    const dto = new PaginatedResponseDto<T>();
    dto.data = data;
    dto.total = total;
    dto.page = page;
    dto.pageSize = pageSize;
    dto.hasMore = page * pageSize < total;
    return dto;
  }
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 4: Commit**

```bash
git add src/shared/application/dto/pagination-query.dto.ts \
        src/shared/application/dto/paginated-response.dto.ts
git commit -m "feat(perf): add shared PaginationQueryDto and PaginatedResponseDto"
```

---

### Task 2: Migration de índices + atualizar schemas Drizzle

**Files:**
- Create: `drizzle/0013_performance_indexes.sql`
- Modify: `drizzle/meta/_journal.json`
- Modify: `src/modules/services/infra/schemas/service.schema.ts`
- Modify: `src/modules/budget-requests/infra/schemas/budget-request.schema.ts`
- Modify: `src/modules/proposal/infra/schemas/proposal.schema.ts`

- [ ] **Step 1: Criar `drizzle/0013_performance_indexes.sql`**

```sql
CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);
CREATE INDEX IF NOT EXISTS budget_requests_user_id_idx ON budget_requests(user_id);
CREATE INDEX IF NOT EXISTS budget_requests_service_id_status_idx ON budget_requests(service_id, status);
CREATE INDEX IF NOT EXISTS proposals_request_id_idx ON proposals(request_id);
CREATE INDEX IF NOT EXISTS proposals_provider_id_idx ON proposals(provider_id);
CREATE INDEX IF NOT EXISTS proposals_client_id_idx ON proposals(client_id);
CREATE INDEX IF NOT EXISTS negotiation_messages_proposal_id_idx ON negotiation_messages(proposal_id);
```

- [ ] **Step 2: Adicionar entrada em `drizzle/meta/_journal.json`** — inserir antes do `}` final do array `entries`:

```json
    ,{
      "idx": 13,
      "version": "7",
      "when": 1779800000000,
      "tag": "0013_performance_indexes",
      "breakpoints": true
    }
```

- [ ] **Step 3: Atualizar `src/modules/services/infra/schemas/service.schema.ts`**

```typescript
import { pgTable, text, timestamp, uuid, numeric, index } from 'drizzle-orm/pg-core';

export const servicesSchema = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    duration: numeric('duration').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    categoryIdx: index('services_category_idx').on(table.category),
  }),
);
```

- [ ] **Step 4: Atualizar `src/modules/budget-requests/infra/schemas/budget-request.schema.ts`**

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';
import { servicesSchema } from '../../../services/infra/schemas/service.schema';

export const statusEnum = pgEnum('status', [
  'pending',
  'answered',
  'cancelled',
]);

export const budgetRequestsSchema = pgTable(
  'budget_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => usersSchema.id)
      .notNull(),
    serviceId: uuid('service_id')
      .references(() => servicesSchema.id)
      .notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    location: text('location').notNull(),
    requestDate: timestamp('request_date', { withTimezone: true }).notNull(),
    status: statusEnum('status').notNull().default('pending'),
    photos: jsonb('photos'),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdIdx: index('budget_requests_user_id_idx').on(table.userId),
    serviceIdStatusIdx: index('budget_requests_service_id_status_idx').on(
      table.serviceId,
      table.status,
    ),
  }),
);
```

- [ ] **Step 5: Atualizar `src/modules/proposal/infra/schemas/proposal.schema.ts`**

```typescript
import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { budgetRequestsSchema } from '../../../budget-requests/infra/schemas/budget-request.schema';
import { conversationSchema } from '../../../chat/infra/schemas/conversation.schema';
import { usersSchema } from '../../../users/infra/schemas/user.schema';

export const proposalStatusEnum = pgEnum('proposal_status', [
  'PENDING',
  'NEGOTIATING',
  'ACCEPTED',
  'PROVIDER_CONFIRMED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]);

export const senderRoleEnum = pgEnum('sender_role', ['CLIENT', 'PROVIDER']);

export const proposalsSchema = pgTable(
  'proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .references(() => budgetRequestsSchema.id)
      .notNull(),
    clientId: uuid('client_id')
      .references(() => usersSchema.id)
      .notNull(),
    providerId: uuid('provider_id')
      .references(() => usersSchema.id)
      .notNull(),
    estimatedHours: numeric('estimated_hours', {
      precision: 10,
      scale: 2,
    }).notNull(),
    hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: proposalStatusEnum('status').notNull().default('PENDING'),
    rejectionReason: text('rejection_reason'),
    linkedChatId: uuid('linked_chat_id').references(() => conversationSchema.id),
    canResubmit: boolean('can_resubmit').notNull().default(true),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => ({
    requestIdIdx: index('proposals_request_id_idx').on(table.requestId),
    providerIdIdx: index('proposals_provider_id_idx').on(table.providerId),
    clientIdIdx: index('proposals_client_id_idx').on(table.clientId),
  }),
);

export const negotiationMessagesSchema = pgTable(
  'negotiation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proposalId: uuid('proposal_id').notNull(),
    senderRole: senderRoleEnum('sender_role').notNull(),
    senderUserId: uuid('sender_user_id').notNull(),
    message: text('message').notNull(),
    revisedAmount: numeric('revised_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => ({
    proposalIdIdx: index('negotiation_messages_proposal_id_idx').on(
      table.proposalId,
    ),
  }),
);
```

- [ ] **Step 6: Build check**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 7: Commit**

```bash
git add drizzle/0013_performance_indexes.sql \
        drizzle/meta/_journal.json \
        src/modules/services/infra/schemas/service.schema.ts \
        src/modules/budget-requests/infra/schemas/budget-request.schema.ts \
        src/modules/proposal/infra/schemas/proposal.schema.ts
git commit -m "feat(perf): add indexes on category, FK filter columns"
```

---

### Task 3: Paginar GET /services e GET /services?category=X

**Files:**
- Modify: `src/modules/services/infra/repositories/drizzle-service.repository.ts`
- Modify: `src/modules/services/application/services/service.service.ts`
- Modify: `src/modules/services/infra/controllers/services.controller.ts`

- [ ] **Step 1: Atualizar `src/modules/services/infra/repositories/drizzle-service.repository.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@shared/infra/database/drizzle.service';
import { servicesSchema } from '../schemas/service.schema';
import { count } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';

@Injectable()
export class DrizzleServiceRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async findAll(
    page: number,
    pageSize: number,
  ): Promise<{ data: any[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(servicesSchema);

    const data = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data, total: Number(total) };
  }

  async findByCategory(
    category: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: any[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(servicesSchema)
      .where(eq(servicesSchema.category, category));

    const data = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .where(eq(servicesSchema.category, category))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data, total: Number(total) };
  }

  async findById(id: string): Promise<any | null> {
    const result = await this.drizzleService.db
      .select()
      .from(servicesSchema)
      .where(eq(servicesSchema.id, id));

    return result[0] ?? null;
  }

  async deleteById(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(servicesSchema)
      .where(eq(servicesSchema.id, id));
  }

  async updateById(id: string, dto: UpdateServiceDto): Promise<void> {
    await this.drizzleService.db
      .update(servicesSchema)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(servicesSchema.id, id));
  }
}
```

- [ ] **Step 2: Atualizar `src/modules/services/application/services/service.service.ts`**

```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleServiceRepository } from '../../infra/repositories/drizzle-service.repository';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { PaginatedResponseDto } from '@shared/application/dto/paginated-response.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly repository: DrizzleServiceRepository) {}

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private validateNonEmptyString(value: string, fieldName: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException(`${fieldName} não pode estar vazio`);
    }
    return trimmed;
  }

  private validatePositiveNumberString(value: string, fieldName: string): string {
    const trimmed = value.trim();
    const parsed = Number(trimmed);

    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new BadRequestException(`${fieldName} deve ser um número positivo`);
    }

    return trimmed;
  }

  async listAll(page: number, pageSize: number): Promise<PaginatedResponseDto<any>> {
    const { data, total } = await this.repository.findAll(page, pageSize);
    return PaginatedResponseDto.of(data, total, page, pageSize);
  }

  async listByCategory(
    category: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponseDto<any>> {
    const { data, total } = await this.repository.findByCategory(category, page, pageSize);
    return PaginatedResponseDto.of(data, total, page, pageSize);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Serviço não encontrado');
    }
    await this.repository.deleteById(id);
  }

  async edit(id: string, dto: UpdateServiceDto): Promise<any> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const payload: UpdateServiceDto = {};

    if (dto.name !== undefined) {
      payload.name = this.validateNonEmptyString(dto.name, 'name');
    }

    if (dto.description !== undefined) {
      payload.description = this.validateNonEmptyString(dto.description, 'description');
    }

    if (dto.category !== undefined) {
      payload.category = this.validateNonEmptyString(dto.category, 'category');
    }

    if (dto.price !== undefined) {
      payload.price = this.validatePositiveNumberString(dto.price, 'price');
    }

    if (dto.duration !== undefined) {
      payload.duration = this.validatePositiveNumberString(dto.duration, 'duration');
    }

    if (dto.userId !== undefined) {
      const userId = this.validateNonEmptyString(dto.userId, 'userId');
      if (!this.isValidUuid(userId)) {
        throw new BadRequestException('userId deve ser um UUID válido');
      }
      payload.userId = userId;
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('Pelo menos um campo deve ser informado para atualização');
    }

    await this.repository.updateById(id, payload);
    return this.repository.findById(id);
  }
}
```

- [ ] **Step 3: Atualizar `src/modules/services/infra/controllers/services.controller.ts`**

```typescript
import {
  Controller,
  Get,
  Query,
  Delete,
  Param,
  ParseUUIDPipe,
  Put,
  Body,
} from '@nestjs/common';
import { ServiceService } from '../../application/services/service.service';
import { UpdateServiceDto } from '../../application/dto/update-service.dto';
import { PaginationQueryDto } from '@shared/application/dto/pagination-query.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async findAll(
    @Query('category') category: string | undefined,
    @Query() query: PaginationQueryDto,
  ) {
    if (category) {
      return this.serviceService.listByCategory(category, query.page, query.pageSize);
    }
    return this.serviceService.listAll(query.page, query.pageSize);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.serviceService.remove(id);
  }

  @Put('/update/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateServiceDto,
  ): Promise<any> {
    return this.serviceService.edit(id, body);
  }
}
```

- [ ] **Step 4: Build check**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/modules/services/infra/repositories/drizzle-service.repository.ts \
        src/modules/services/application/services/service.service.ts \
        src/modules/services/infra/controllers/services.controller.ts
git commit -m "feat(perf): paginate GET /services"
```

---

### Task 4: Paginar GET /budget-requests/user/:userId

**Files:**
- Modify: `src/modules/budget-requests/domain/repositories/budget-request-repository.interface.ts`
- Modify: `src/modules/budget-requests/infra/repositories/drizzle-budget-request.repository.ts`
- Modify: `src/modules/budget-requests/application/services/budget-request.service.ts`
- Modify: `src/modules/budget-requests/infra/controllers/budget-requests.controller.ts`

- [ ] **Step 1: Atualizar `src/modules/budget-requests/domain/repositories/budget-request-repository.interface.ts`**

```typescript
import { BudgetRequest } from '../models/budget-request.entity';

export const BUDGET_REQUEST_REPOSITORY = Symbol('BudgetRequestRepository');

export interface BudgetRequestRepository {
  create(budgetRequest: BudgetRequest): Promise<void>;
  update(budgetRequest: BudgetRequest): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<BudgetRequest | null>;
  findByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: BudgetRequest[]; total: number }>;
  findAvailableByServiceId(serviceId: string): Promise<BudgetRequest[]>;
  findAll(): Promise<BudgetRequest[]>;
}
```

- [ ] **Step 2: Atualizar `findByUserId` em `src/modules/budget-requests/infra/repositories/drizzle-budget-request.repository.ts`**

Substituir o método `findByUserId` existente:

```typescript
  async findByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: BudgetRequest[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(budgetRequestsSchema)
      .where(eq(budgetRequestsSchema.userId, userId));

    const rows = await this.drizzleService.db
      .select()
      .from(budgetRequestsSchema)
      .where(eq(budgetRequestsSchema.userId, userId))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      data: rows.map((row) => BudgetRequest.restore(row)!),
      total: Number(total),
    };
  }
```

Adicionar `count` ao import do drizzle-orm no topo do arquivo:

```typescript
import { and, eq, count } from 'drizzle-orm';
```

- [ ] **Step 3: Atualizar `findByUserId` em `src/modules/budget-requests/application/services/budget-request.service.ts`**

Adicionar import:
```typescript
import { PaginatedResponseDto } from '@shared/application/dto/paginated-response.dto';
```

Substituir o método `findByUserId`:

```typescript
  async findByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponseDto<BudgetRequestDto>> {
    const { data, total } = await this.repository.findByUserId(userId, page, pageSize);
    return PaginatedResponseDto.of(
      data.map((s) => this.toDto(s)),
      total,
      page,
      pageSize,
    );
  }
```

- [ ] **Step 4: Atualizar `findByUserId` em `src/modules/budget-requests/infra/controllers/budget-requests.controller.ts`**

Adicionar import:
```typescript
import { PaginationQueryDto } from '@shared/application/dto/pagination-query.dto';
```

Substituir o handler `findByUserId`:

```typescript
  @Get('user/:userId')
  findByUserId(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.findByUserId(userId, query.page, query.pageSize);
  }
```

- [ ] **Step 5: Build check**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
git add src/modules/budget-requests/domain/repositories/budget-request-repository.interface.ts \
        src/modules/budget-requests/infra/repositories/drizzle-budget-request.repository.ts \
        src/modules/budget-requests/application/services/budget-request.service.ts \
        src/modules/budget-requests/infra/controllers/budget-requests.controller.ts
git commit -m "feat(perf): paginate GET /budget-requests/user/:userId"
```

---

### Task 5: Paginar GET /proposals/provider/created e /client/requested

**Files:**
- Modify: `src/modules/proposal/domain/repositories/proposal-repository.interface.ts`
- Modify: `src/modules/proposal/infra/repositories/drizzle-proposal.repository.ts`
- Modify: `src/modules/proposal/application/services/proposal.service.ts`
- Modify: `src/modules/proposal/infra/controllers/proposals.controller.ts`

- [ ] **Step 1: Atualizar `src/modules/proposal/domain/repositories/proposal-repository.interface.ts`**

> Apenas `ProposalRepository` muda aqui. `NegotiationMessageRepository.findByProposalId` é atualizado na Task 6 junto com sua implementação — evita build quebrado entre tasks.

```typescript
import type { Proposal, NegotiationMessage } from '../models/proposal.entity';

export const PROPOSAL_REPOSITORY = Symbol('PROPOSAL_REPOSITORY');
export const NEGOTIATION_MESSAGE_REPOSITORY = Symbol(
  'NEGOTIATION_MESSAGE_REPOSITORY',
);

export interface ProposalRepository {
  create(proposal: Proposal): Promise<void>;
  update(proposal: Proposal): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Proposal[]>;
  findById(id: string): Promise<Proposal | null>;
  findByRequestId(requestId: string): Promise<Proposal[]>;
  findByClientId(
    clientId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }>;
  findByProviderId(
    providerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }>;
  findByRequestAndProvider(
    requestId: string,
    providerId: string,
  ): Promise<Proposal | null>;
}

export interface NegotiationMessageRepository {
  create(message: NegotiationMessage): Promise<void>;
  findByProposalId(proposalId: string): Promise<NegotiationMessage[]>;
  findById(id: string): Promise<NegotiationMessage | null>;
}
```

- [ ] **Step 2: Atualizar `findByProviderId` e `findByClientId` em `src/modules/proposal/infra/repositories/drizzle-proposal.repository.ts`**

Adicionar `count` ao import do drizzle-orm:
```typescript
import { eq, and, count } from 'drizzle-orm';
```

Substituir `findByProviderId`:

```typescript
  async findByProviderId(
    providerId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(proposalsSchema)
      .where(eq(proposalsSchema.providerId, providerId));

    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.providerId, providerId))
      .orderBy(proposalsSchema.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data: result.map(this.mapToEntity), total: Number(total) };
  }
```

Substituir `findByClientId`:

```typescript
  async findByClientId(
    clientId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Proposal[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(proposalsSchema)
      .where(eq(proposalsSchema.clientId, clientId));

    const result = await this.drizzleService.db
      .select()
      .from(proposalsSchema)
      .where(eq(proposalsSchema.clientId, clientId))
      .orderBy(proposalsSchema.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data: result.map(this.mapToEntity), total: Number(total) };
  }
```

- [ ] **Step 3: Atualizar `proposal.service.ts`**

Adicionar import:
```typescript
import { PaginatedResponseDto } from '@shared/application/dto/paginated-response.dto';
```

Substituir `getProposalsByProvider`:

```typescript
  async getProposalsByProvider(
    providerId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponseDto<ProposalDto>> {
    const { data, total } = await this.proposalRepository.findByProviderId(
      providerId,
      page,
      pageSize,
    );
    return PaginatedResponseDto.of(
      data.map((p) => ProposalDto.from(p)!),
      total,
      page,
      pageSize,
    );
  }
```

Substituir `getProposalsByClient`:

```typescript
  async getProposalsByClient(
    clientId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponseDto<ProposalDto>> {
    const { data, total } = await this.proposalRepository.findByClientId(
      clientId,
      page,
      pageSize,
    );
    return PaginatedResponseDto.of(
      data.map((p) => ProposalDto.from(p)!),
      total,
      page,
      pageSize,
    );
  }
```

> **Atenção:** `getProposalsByRequest` (usado em `GET /proposals?requestId=X`) NÃO recebe paginação — permanece retornando `Proposal[]`. Não alterar essa assinatura.

- [ ] **Step 4: Atualizar `proposals.controller.ts`**

Adicionar import:
```typescript
import { PaginationQueryDto } from '@shared/application/dto/pagination-query.dto';
```

Substituir `findProviderCreated`:

```typescript
  @Get('provider/created')
  async findProviderCreated(
    @CurrentUser() providerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.proposalService.getProposalsByProvider(
      providerId,
      query.page,
      query.pageSize,
    );
  }
```

Substituir `findClientRequested`:

```typescript
  @Get('client/requested')
  async findClientRequested(
    @CurrentUser() clientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.proposalService.getProposalsByClient(
      clientId,
      query.page,
      query.pageSize,
    );
  }
```

- [ ] **Step 5: Build check**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
git add src/modules/proposal/domain/repositories/proposal-repository.interface.ts \
        src/modules/proposal/infra/repositories/drizzle-proposal.repository.ts \
        src/modules/proposal/application/services/proposal.service.ts \
        src/modules/proposal/infra/controllers/proposals.controller.ts
git commit -m "feat(perf): paginate GET /proposals/provider/created and /client/requested"
```

---

### Task 6: Paginar GET /negotiations/:proposalId/messages

**Files:**
- Modify: `src/modules/proposal/infra/repositories/drizzle-proposal.repository.ts`
- Modify: `src/modules/proposal/application/services/negotiation.service.ts`
- Modify: `src/modules/proposal/infra/controllers/proposals.controller.ts`

- [ ] **Step 1: Atualizar interface `NegotiationMessageRepository` em `src/modules/proposal/domain/repositories/proposal-repository.interface.ts`**

Substituir apenas a assinatura de `findByProposalId` na interface `NegotiationMessageRepository`:

```typescript
export interface NegotiationMessageRepository {
  create(message: NegotiationMessage): Promise<void>;
  findByProposalId(
    proposalId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: NegotiationMessage[]; total: number }>;
  findById(id: string): Promise<NegotiationMessage | null>;
}
```

- [ ] **Step 2: Atualizar `findByProposalId` em `DrizzleNegotiationMessageRepository` (`src/modules/proposal/infra/repositories/drizzle-proposal.repository.ts`)**

Substituir o método `findByProposalId` na classe `DrizzleNegotiationMessageRepository`:

```typescript
  async findByProposalId(
    proposalId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: NegotiationMessage[]; total: number }> {
    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(negotiationMessagesSchema)
      .where(eq(negotiationMessagesSchema.proposalId, proposalId));

    const result = await this.drizzleService.db
      .select()
      .from(negotiationMessagesSchema)
      .where(eq(negotiationMessagesSchema.proposalId, proposalId))
      .orderBy(negotiationMessagesSchema.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { data: result.map(this.mapToEntity), total: Number(total) };
  }
```

- [ ] **Step 3: Atualizar `getMessages` em `src/modules/proposal/application/services/negotiation.service.ts`**

Adicionar import:
```typescript
import { PaginatedResponseDto } from '@shared/application/dto/paginated-response.dto';
```

Substituir `getMessages`:

```typescript
  async getMessages(
    proposalId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponseDto<NegotiationMessageDto>> {
    const proposal = await this.proposalRepository.findById(proposalId);
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    const { data, total } = await this.messageRepository.findByProposalId(
      proposalId,
      page,
      pageSize,
    );
    return PaginatedResponseDto.of(
      data.map((m) => NegotiationMessageDto.from(m)!),
      total,
      page,
      pageSize,
    );
  }
```

- [ ] **Step 4: Atualizar `getMessages` handler em `proposals.controller.ts`**

Substituir o handler `getMessages` no `NegotiationsController`:

```typescript
  @Get(':proposalId/messages')
  async getMessages(
    @Param('proposalId') proposalId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.negotiationService.getMessages(
      proposalId,
      query.page,
      query.pageSize,
    );
  }
```

> `PaginationQueryDto` já importado na Task 5.

- [ ] **Step 5: Build check final**

```bash
npm run build
```
Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
git add src/modules/proposal/domain/repositories/proposal-repository.interface.ts \
        src/modules/proposal/infra/repositories/drizzle-proposal.repository.ts \
        src/modules/proposal/application/services/negotiation.service.ts \
        src/modules/proposal/infra/controllers/proposals.controller.ts
git commit -m "feat(perf): paginate GET /negotiations/:proposalId/messages"
```

---

## Verificação final

```bash
git log --oneline main..HEAD
```

Esperado — 6 commits na branch:
```
feat(perf): paginate GET /negotiations/:proposalId/messages
feat(perf): paginate GET /proposals/provider/created and /client/requested
feat(perf): paginate GET /budget-requests/user/:userId
feat(perf): paginate GET /services
feat(perf): add indexes on category, FK filter columns
feat(perf): add shared PaginationQueryDto and PaginatedResponseDto
```

Teste manual — testar paginação em `/services`:
```bash
curl "http://localhost:3000/services?page=1&pageSize=5"
```
Esperado: `{ "data": [...], "total": N, "page": 1, "pageSize": 5, "hasMore": true/false }`

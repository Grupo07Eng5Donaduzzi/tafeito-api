# Spec: Criar Avaliação

**Data:** 2026-05-20  
**Branch:** criar-avaliação  
**Base:** Confirmar_conclusão_prestador_e_cliente

---

## Contexto

Após cliente confirmar conclusão de serviço (proposta status `COMPLETED`), cliente pode registrar nota (1–5 estrelas) e comentário opcional sobre o prestador.

---

## Requisitos

- Só o cliente da proposta pode criar avaliação
- Avaliação só permitida quando `proposal.status === COMPLETED`
- Uma avaliação por proposta (unique constraint)
- Nota: inteiro 1–5, obrigatório
- Comentário: texto, opcional
- Cliente pode editar nota/comentário após criação

---

## Schema

Tabela `reviews`:

| campo | tipo | regras |
|---|---|---|
| `id` | uuid PK | defaultRandom() |
| `proposal_id` | uuid FK → proposals | unique, NOT NULL |
| `reviewer_id` | uuid FK → users | NOT NULL (clientId) |
| `reviewed_id` | uuid FK → users | NOT NULL (providerId) |
| `rating` | integer | NOT NULL, 1–5 |
| `comment` | text | nullable |
| `created_at` | timestamp | NOT NULL |
| `updated_at` | timestamp | NOT NULL |

---

## Endpoints

| método | rota | auth | descrição |
|---|---|---|---|
| `POST` | `/proposals/:proposalId/review` | cliente | Cria avaliação |
| `PATCH` | `/reviews/:reviewId` | cliente (dono) | Edita nota/comentário |
| `GET` | `/reviews/provider/:providerId` | qualquer auth | Lista avaliações do prestador |
| `GET` | `/proposals/:proposalId/review` | participante | Busca avaliação da proposta |

### POST /proposals/:proposalId/review

**Body:**
```json
{
  "rating": 5,
  "comment": "Ótimo serviço!" 
}
```

**Validações:**
1. Proposta existe → 404
2. `proposal.status === COMPLETED` → 400
3. `userId === proposal.clientId` → 403
4. Sem avaliação prévia para proposta → 409 Conflict
5. `rating` entre 1 e 5 → 400

**Resposta 201:** `ReviewDto`

### PATCH /reviews/:reviewId

**Body (parcial):**
```json
{
  "rating": 4,
  "comment": "Atualizado"
}
```

**Validações:**
1. Avaliação existe → 404
2. `userId === review.reviewerId` → 403
3. `rating` entre 1 e 5 se fornecido → 400

**Resposta 200:** `ReviewDto`

---

## Arquitetura do Módulo

```
src/modules/reviews/
├── domain/
│   ├── models/review.entity.ts
│   └── repositories/review-repository.interface.ts
├── application/
│   ├── dto/review.dto.ts
│   └── services/review.service.ts
├── infra/
│   ├── controllers/reviews.controller.ts
│   ├── repositories/drizzle-review.repository.ts
│   └── schemas/review.schema.ts
└── reviews.module.ts
```

`ReviewService` injeta `ProposalRepository` via token `PROPOSAL_REPOSITORY` para validar status — sem acoplamento circular.

`ReviewsModule` importa `SharedModule` (DrizzleService) e `ProposalModule`.

---

## Entidade

```typescript
class Review {
  static create(props: { proposalId, reviewerId, reviewedId, rating, comment? }): Review
  static restore(props: {...}): Review
  updateRating(rating: number, comment?: string): void  // valida 1-5
}
```

---

## DTOs

**CreateReviewDto:** `rating` (number, 1–5), `comment` (string, opcional)  
**UpdateReviewDto:** `rating` (number, 1–5, opcional), `comment` (string, opcional)  
**ReviewDto:** todos os campos + método estático `from(entity)`

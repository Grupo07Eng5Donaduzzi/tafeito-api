# TaFeito Monorepo

Projeto de estudo de microservicos para uma plataforma de contratacao de servicos, organizado como um monorepo com servicos NestJS independentes, bancos separados por contexto e comunicacao assincrona via RabbitMQ.

Cada micro-servico possui:

- API HTTP com prefixo global `/v1`
- documentacao Swagger em `/docs`
- banco PostgreSQL proprio
- integracao por eventos para manter projecoes locais entre contextos
- autenticacao JWT

## O que o projeto cobre

O dominio foi separado em tres contextos:

| Micro-servico | Porta padrao | Banco padrao    | Responsabilidade principal                                         |
| ------------- | ------------ | --------------- | ------------------------------------------------------------------ |
| `main`        | `4001`       | `tafeito_main`  | Auth, usuarios, servicos, orcamentos, propostas, agendas e reviews |
| `payment`     | `4002`       | `tafeito_payment` | Pagamentos PIX via Asaas, webhooks e repasses ao prestador       |
| `chat`        | `4003`       | `tafeito_chat`  | Mensagens e conversas em tempo real entre cliente e prestador      |

## Relacao entre os servicos

| Micro-servico | Publica eventos                                        | Consome eventos                                  |
| ------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `main`        | `proposal.accepted`, `proposal.contested`, `proposal.client-confirmed` | `payment.created`, `payment.confirmed`, `conversation.created` |
| `payment`     | `payment.created`, `payment.confirmed`                 | `proposal.accepted`, `proposal.client-confirmed` |
| `chat`        | `conversation.created`                                 | `proposal.accepted`, `proposal.contested`        |

Como os servicos mantem projecoes locais a partir de eventos, o ideal e subir todos antes de comecar a cadastrar dados.

## Fluxo de negocio

```
Cliente registra → Prestador vira provider → Prestador cria servico
→ Cliente cria orcamento → Prestador envia proposta
→ Cliente contesta (negocia) ou aceita
→ Aceite gera pagamento PIX via Asaas
→ Pagamento confirmado → Prestador confirma conclusao
→ Cliente confirma conclusao → Avaliacao + repasse PIX ao prestador
```

## Pre-requisitos

- Node.js com `npm`
- PostgreSQL
- RabbitMQ
- Docker e Docker Compose

Voce pode usar uma unica instancia do PostgreSQL, desde que crie tres bancos:

- `tafeito_main`
- `tafeito_payment`
- `tafeito_chat`

## Variaveis de ambiente

### `main`

```env
PORT=4001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tafeito_main
RABBITMQ_URL=amqp://admin:admin@localhost:5672
JWT_SECRET=your-jwt-secret
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
```

### `payment`

```env
PORT=4002
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tafeito_payment
RABBITMQ_URL=amqp://admin:admin@localhost:5672
JWT_SECRET=your-jwt-secret
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3
ASAAS_ACCESS_TOKEN=your-asaas-access-token
ASAAS_USER_AGENT=tafeito-api/1.0
```

### `chat`

```env
PORT=4003
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tafeito_chat
RABBITMQ_URL=amqp://admin:admin@localhost:5672
JWT_SECRET=your-jwt-secret
FRONTEND_URL=*
```

Observacoes importantes:

- O `JWT_SECRET` deve ser o mesmo em todos os servicos.
- O `DATABASE_URL` muda de acordo com o banco de cada micro-servico.
- O `PORT` muda de acordo com o servico.
- O `FIREBASE_*` so e necessario no `main` e apenas para o endpoint de recuperacao de senha.
- O `ASAAS_ACCESS_TOKEN` pode ser obtido no [painel sandbox da Asaas](https://sandbox.asaas.com/).
- Os arquivos de exemplo ja existem em `services/*/.env.example`.

## Como rodar

### Com Docker Compose

O jeito mais rapido de subir todo o ambiente e usar o `docker-compose.yml` da raiz. Ele sobe:

- os 3 micro-servicos
- 1 instancia do PostgreSQL com 3 bancos separados
- 1 instancia do RabbitMQ
- 1 instancia do Adminer

Subir tudo com build:

```bash
docker compose up --build
```

Subir em background:

```bash
docker compose up --build -d
```

Parar os containers sem remover volumes:

```bash
docker compose down
```

Parar e remover containers, rede e volumes:

```bash
docker compose down -v
```

Se quiser recriar as imagens do zero:

```bash
docker compose build --no-cache
docker compose up -d
```

Endpoints uteis depois que o ambiente subir:

- `main`: `http://localhost:4001/api`
- `payment`: `http://localhost:4002/docs`
- `chat`: `http://localhost:4003/docs`
- Adminer: `http://localhost:8080`
- RabbitMQ Management: `http://localhost:15672`

Credenciais padrao:

- PostgreSQL: usuario `postgres`, senha `postgres`
- RabbitMQ: usuario `admin`, senha `admin`

No Adminer, use:

- Sistema: `PostgreSQL`
- Servidor: `postgres`
- Usuario: `postgres`
- Senha: `postgres`
- Base de dados: uma das bases do projeto, como `tafeito_main`

Observacao:

- O script de criacao dos bancos roda na inicializacao do Postgres. Se voce ja tiver um volume antigo sem os bancos criados, rode `docker compose down -v` antes de subir novamente.

### Rodando manualmente

Fluxo recomendado:

1. Inicie PostgreSQL e RabbitMQ.
2. Copie o `.env.example` para `.env` em cada servico.
3. Instale as dependencias de cada servico com `npm install`.
4. Rode as migrations de cada banco com `npm run db:push`.
5. Suba os servicos com `npm run start:dev`.

## Como rodar cada micro-servico

### `main`

Responsabilidade:
Gerencia o nucleo do dominio: autenticacao, usuarios, servicos, orcamentos, propostas, negociacoes, agendamentos e reviews.

Principais rotas:
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/forgot-password`
- `PATCH /v1/auth/becomeProvider`
- `GET /v1/users/me`
- `GET/PUT/DELETE /v1/users/:id`
- `GET/POST /v1/services`
- `POST /v1/services/:id/photo`
- `GET/POST /v1/budgetRequests`
- `GET /v1/budgetRequests/mine`
- `GET /v1/budgetRequests/available`
- `POST /v1/budgetRequests/:id/photos`
- `PATCH /v1/budgetRequests/:id/cancel`
- `GET/POST /v1/proposals`
- `GET /v1/proposals/client/requested`
- `GET /v1/proposals/provider/created`
- `GET /v1/proposals/client/history`
- `GET /v1/proposals/provider/history`
- `PATCH /v1/proposals/:id/contest`
- `POST /v1/proposals/:id/accept`
- `PATCH /v1/proposals/:id/providerConfirm`
- `PATCH /v1/proposals/:id/clientConfirm`
- `GET /v1/proposals/:id/payment`
- `POST/GET /v1/proposals/:id/invoice`
- `POST /v1/negotiations/:proposalId/messages`
- `POST /v1/negotiations/:proposalId/revisedProposal`
- `GET /v1/negotiations/:proposalId/messages`
- `GET /v1/schedules/proposal/:proposalId`
- `POST /v1/reviews/proposals/:proposalId`
- `GET /v1/reviews/proposals/:proposalId`
- `PATCH /v1/reviews/:id`
- `GET /v1/reviews/provider/:providerId`
- `GET /v1/reviews/provider/:providerId/summary`

Comandos:

```bash
cd services/main
cp .env.example .env
npm install
npm run db:push
npm run start:dev
```

Swagger:
`http://localhost:4001/api`

### `payment`

Responsabilidade:
Gerencia pagamentos PIX via Asaas. Cria cobrancas a partir do evento de proposta aceita, processa webhooks de confirmacao e realiza repasses ao prestador quando o servico e concluido.

Principais rotas:
- `GET /v1/payments/:id/status`
- `POST /v1/payments/webhook/asaas`

Comandos:

```bash
cd services/payment
cp .env.example .env
npm install
npm run db:push
npm run start:dev
```

Swagger:
`http://localhost:4002/docs`

### `chat`

Responsabilidade:
Gerencia mensagens e conversas entre cliente e prestador. Cria conversas automaticamente quando uma proposta e aceita ou contestada.

Principais rotas:
- `POST /v1/chat/messages`
- `GET /v1/chat/messages/:id`
- `PATCH /v1/chat/messages/:id/read`
- `PATCH /v1/chat/messages/:id/delivered`
- `GET /v1/chat/conversations/:id`
- `POST /v1/chat/conversations/:id/messages`
- `GET /v1/chat/conversations/:id/messages`
- `GET /v1/chat/users/:userId/messages`
- `GET /v1/chat/services/:serviceId/conversations`
- `GET /v1/chat/services/:serviceId/messages`

Comandos:

```bash
cd services/chat
cp .env.example .env
npm install
npm run db:push
npm run start:dev
```

Swagger:
`http://localhost:4003/docs`

## Autenticacao

- O registro e feito em `POST /v1/auth/register`.
- O login e feito em `POST /v1/auth/login`.
- O token JWT emitido pelo `main` deve ser enviado como `Bearer Token` em todos os servicos.
- Para se tornar prestador, o usuario logado deve chamar `PATCH /v1/auth/becomeProvider` com `pixKey` e `hourlyRate`.
- Rotas publicas: `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password` e `POST /payments/webhook/asaas`.

## Ordem sugerida para testes integrados

Se a ideia for testar o fluxo completo do dominio, esta ordem ajuda:

1. Registrar um usuario como cliente e outro como prestador
2. Prestador chama `becomeProvider` para habilitar criacao de servicos e propostas
3. Prestador cria um servico
4. Cliente cria um orcamento vinculado ao servico
5. Prestador envia uma proposta para o orcamento
6. Cliente contesta a proposta (inicia negociacao) — nesse momento uma conversa e criada no `chat`
7. Prestador envia proposta revisada
8. Cliente aceita a proposta — gera cobranca PIX via Asaas no `payment`
9. Pagamento e confirmado via webhook `POST /payments/webhook/asaas`
10. Prestador confirma conclusao do servico (`providerConfirm`)
11. Prestador faz upload da nota fiscal
12. Cliente confirma conclusao (`clientConfirm`) — dispara repasse PIX ao prestador
13. Cliente cria uma review para a proposta

Um script de teste completo cobrindo todos os endpoints esta em `test-project/run-tests.mjs`. Para executa-lo:

```bash
node test-project/run-tests.mjs
```

Requer Node.js 22+ com fetch nativo e os tres servicos rodando.

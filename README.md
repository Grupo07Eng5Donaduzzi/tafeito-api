# TaFeito Monorepo

Projeto de estudo de microsserviços para uma plataforma de contratação de serviços, organizado como um monorepo com serviços NestJS independentes, bancos separados por contexto e comunicação assíncrona via RabbitMQ.

Cada microsserviço possui:

- API HTTP com prefixo global `/v1`
- documentação Swagger em `/docs`
- banco PostgreSQL próprio
- integração por eventos para manter projeções locais entre contextos
- autenticação JWT

## O que o projeto cobre

O domínio foi separado em três contextos:

| Microsserviço | Porta padrão | Banco padrão    | Responsabilidade principal                                         |
| ------------- | ------------ | --------------- | ------------------------------------------------------------------ |
| `main`        | `4001`       | `tafeito_main`  | Auth, usuários, serviços, orçamentos, propostas e reviews |
| `payment`     | `4002`       | `tafeito_payment` | Pagamentos PIX via Asaas, webhooks e repasses ao prestador       |
| `chat`        | `4003`       | `tafeito_chat`  | Mensagens e conversas em tempo real entre cliente e prestador      |

## Relação entre os serviços

| Microsserviço | Publica eventos                                        | Consome eventos                                  |
| ------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `main`        | `proposal.accepted`, `proposal.client-confirmed` e comandos de chat via RabbitMQ | `payment.created`, `payment.confirmed` |
| `payment`     | `payment.created`, `payment.confirmed`                 | `proposal.accepted`, `proposal.client-confirmed` |
| `chat`        | Respostas correlacionadas dos comandos de chat         | `proposal.accepted` e comandos de chat via RabbitMQ |

Como os serviços mantêm projeções locais a partir de eventos, o ideal é subir todos antes de começar a cadastrar dados.

O `main` não chama endpoints HTTP internos do `chat`. A criação de conversa e o envio das
mensagens automáticas de negociação usam request/reply pelo RabbitMQ, com `correlationId` e fila
de resposta exclusiva. O evento `proposal.accepted` também garante a criação assíncrona da conversa.

## Fluxo de negócio

```
Cliente registra → Prestador vira provider → Prestador cria serviço
→ Cliente cria orçamento → Prestador envia proposta
→ Cliente contesta (negocia) ou aceita
→ Aceite gera pagamento PIX via Asaas
→ Pagamento confirmado → Prestador confirma conclusão
→ Cliente confirma conclusão → Avaliação + repasse PIX ao prestador
```

## Pré-requisitos

- Node.js com `npm`
- PostgreSQL
- RabbitMQ
- Docker e Docker Compose

Você pode usar uma única instância do PostgreSQL, desde que crie três bancos:

- `tafeito_main`
- `tafeito_payment`
- `tafeito_chat`

## Variáveis de ambiente

### `main`

```env
PORT=4001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tafeito_main
RABBITMQ_URL=amqp://admin:admin@localhost:5672
JWT_SECRET=your-jwt-secret
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_API_KEY=your-firebase-web-api-key
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

Observações importantes:

- O `JWT_SECRET` deve ser o mesmo em todos os serviços.
- O `DATABASE_URL` muda de acordo com o banco de cada microsserviço.
- O `PORT` muda de acordo com o serviço.
- O `FIREBASE_*` é necessário no `main` para cadastro, login e recuperação de senha. A conta de
  serviço (`PROJECT_ID`, `CLIENT_EMAIL` e `PRIVATE_KEY`) e a `API_KEY` devem pertencer ao mesmo
  projeto Firebase.
- O `ASAAS_ACCESS_TOKEN` pode ser obtido no [painel sandbox da Asaas](https://sandbox.asaas.com/).
- Os arquivos de exemplo já existem em `services/*/.env.example`.

## Como rodar

### Com Docker Compose

O jeito mais rápido de subir todo o ambiente é usar o `docker-compose.yml` da raiz. Ele sobe:

- os 3 microsserviços
- 1 instância do PostgreSQL com 3 bancos separados
- 1 instância do RabbitMQ
- 1 instância do Adminer

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

Endpoints úteis depois que o ambiente subir:

- `main`: `http://localhost:4001/api`
- `payment`: `http://localhost:4002/docs`
- `chat`: `http://localhost:4003/docs`
- Adminer: `http://localhost:8080`
- RabbitMQ Management: `http://localhost:15672`

Credenciais padrão:

- PostgreSQL: usuário `postgres`, senha `postgres`
- RabbitMQ: usuário `admin`, senha `admin`

No Adminer, use:

- Sistema: `PostgreSQL`
- Servidor: `postgres`
- Usuário: `postgres`
- Senha: `postgres`
- Base de dados: uma das bases do projeto, como `tafeito_main`

Observação:

- O script de criação dos bancos roda na inicialização do Postgres. Se você já tiver um volume antigo sem os bancos criados, rode `docker compose down -v` antes de subir novamente.

### Rodando manualmente

Fluxo recomendado:

1. Inicie PostgreSQL e RabbitMQ.
2. Copie o `.env.example` para `.env` em cada serviço.
3. Instale as dependências de cada serviço com `npm install`.
4. Rode as migrations de cada banco com `npm run db:push`.
5. Suba os serviços com `npm run start:dev`.

## Como rodar cada microsserviço

### `main`

Responsabilidade:
Gerencia o núcleo do domínio: autenticação, usuários, serviços, orçamentos, propostas, negociações e reviews.

Principais rotas:
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/forgot-password`
- `PATCH /v1/auth/becomeProvider`
- `GET /v1/users/me`
- `POST /v1/users/me/avatar`
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
- `POST /v1/reviews/services/:serviceId`
- `GET /v1/reviews/services/:serviceId`
- `GET /v1/reviews/services/:serviceId/my`
- `GET /v1/reviews/services/:serviceId/summary`
- `PATCH /v1/reviews/:reviewId`

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
Gerencia pagamentos PIX via Asaas. Cria cobranças a partir do evento de proposta aceita, processa webhooks de confirmação e realiza repasses ao prestador quando o serviço é concluído.

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
Gerencia mensagens e conversas entre cliente e prestador. Cria conversas automaticamente quando uma proposta é aceita ou contestada.

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

## Autenticação

- O registro é feito em `POST /v1/auth/register`.
- O login é feito em `POST /v1/auth/login`.
- O token JWT emitido pelo `main` deve ser enviado como `Bearer Token` em todos os serviços.
- Para se tornar prestador, o usuário logado deve chamar `PATCH /v1/auth/becomeProvider` com `pixKey` e `hourlyRate`.
- Rotas públicas: `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password` e `POST /payments/webhook/asaas`.

## Ordem sugerida para testes integrados

Se a ideia for testar o fluxo completo do domínio, esta ordem ajuda:

1. Registrar um usuário como cliente e outro como prestador
2. Prestador chama `becomeProvider` para habilitar criação de serviços e propostas
3. Prestador cria um serviço
4. Cliente cria um orçamento vinculado ao serviço
5. Prestador envia uma proposta para o orçamento
6. Cliente contesta a proposta (inicia negociação) — nesse momento uma conversa é criada no `chat`
7. Prestador envia proposta revisada
8. Cliente aceita a proposta — gera cobrança PIX via Asaas no `payment`
9. Pagamento é confirmado via webhook `POST /payments/webhook/asaas`
10. Prestador confirma conclusão do serviço (`providerConfirm`)
11. Prestador faz upload da nota fiscal
12. Cliente confirma conclusão (`clientConfirm`) — dispara repasse PIX ao prestador
13. Cliente cria uma review para a proposta

# TaFeito API

Backend da aplicação **TaFeito**, construído com [NestJS](https://nestjs.com/), [Drizzle ORM](https://orm.drizzle.team/) e [Firebase Auth](https://firebase.google.com/docs/auth).

## Stack

- **Framework:** NestJS 11
- **Linguagem:** TypeScript
- **Banco de dados:** PostgreSQL + Drizzle ORM
- **Autenticação:** Firebase Auth (email/senha)
- **Arquitetura:** Clean Architecture + DDD

## Estrutura do projeto

```
src/
├── modules/
│   └── users/
│       ├── application/
│       │   ├── dto/          # DTOs de entrada e saída
│       │   └── services/     # Casos de uso
│       ├── domain/
│       │   ├── models/       # Entidades de domínio
│       │   └── repositories/ # Interfaces dos repositórios
│       └── infra/
│           ├── controllers/  # Endpoints REST
│           ├── firebase/     # Integração Firebase Admin
│           ├── repositories/ # Implementações Drizzle
│           └── schemas/      # Schemas do banco (Drizzle)
└── shared/
    └── infra/
        └── database/         # DrizzleService (conexão Postgres)
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente ou em nuvem
- Projeto criado no [Firebase Console](https://console.firebase.google.com/)

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base):

```bash
cp .env.example .env
```

Preencha as variáveis:

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/tafeito

# Firebase Admin SDK
# Obtenha em: Firebase Console → Project Settings → Service Accounts → Generate new private key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
```

> **Atenção:** a `FIREBASE_PRIVATE_KEY` deve ficar em uma única linha entre aspas duplas, com os `\n` literais — exatamente como vem no JSON baixado do Firebase.

### 3. Rodar as migrations

```bash
npm run db:generate   # gera os arquivos de migration
npm run db:migrate    # aplica no banco
```

## Rodando a aplicação

```bash
# desenvolvimento (hot reload)
npm run start:dev

# produção
npm run build
npm run start:prod
```

A API estará disponível em `http://localhost:3000`
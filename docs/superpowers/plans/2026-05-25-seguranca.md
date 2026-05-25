# segurança — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `segurança` branch consolidating invoices + reviews + full security implementation (Helmet, CORS, throttler, HTTPS, input validation).

**Architecture:** `main` already has both feature branches merged and security implemented (helmet, throttler, CORS, HTTPS, forbidNonWhitelisted ValidationPipe, @MaxLength on all DTOs). Only two DTOs are missing validation: `BecomeProviderDto` and `CreatePixPaymentDto`. This plan creates the branch and closes those gaps.

**Tech Stack:** NestJS 11, `class-validator`, `helmet`, `@nestjs/throttler`, Drizzle ORM, PostgreSQL

---

## Context: What main already has

- `src/main.ts` — helmet, CORS, HTTPS (via env), ValidationPipe `forbidNonWhitelisted: true`
- `src/app.module.ts` — ThrottlerModule (100 req/60s global), APP_GUARD ThrottlerGuard
- `src/modules/auth/infra/controllers/auth.controller.ts` — `@Throttle({ default: { limit: 5, ttl: 60000 } })` on login
- `src/modules/users/infra/controllers/users.controller.ts` — `@Throttle` on registration
- All DTOs have `@MaxLength`/`@MinLength` **except** `BecomeProviderDto` and `CreatePixPaymentDto`

---

### Task 1: Create `segurança` branch

**Files:** git only

- [ ] **Step 1: Create branch from main**

```bash
cd C:\Users\gabry\Documents\tafeito-api
git checkout -b segurança main
```

Expected: `Switched to a new branch 'segurança'`

- [ ] **Step 2: Verify branch has both modules**

```bash
git show HEAD:src/app.module.ts | grep -E "Invoices|Reviews|Throttler"
```

Expected output includes `InvoicesModule`, `ReviewsModule`, `ThrottlerModule`.

---

### Task 2: Add validation to `BecomeProviderDto`

**Files:**
- Modify: `src/modules/auth/application/dto/become-provider.dto.ts`

**Current state (no validation):**
```typescript
export class BecomeProviderDto {
  pixKey: string;
}
```

PIX keys: CPF (11 digits), CNPJ (14 digits), email, phone (+55...), or EVP UUID. Max length = 77 chars (EVP UUID is 36, email up to 77 per BACEN spec).

- [ ] **Step 1: Write failing test**

File: `src/modules/auth/application/dto/become-provider.dto.spec.ts`

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BecomeProviderDto } from './become-provider.dto';

describe('BecomeProviderDto', () => {
  it('rejects missing pixKey', async () => {
    const dto = plainToInstance(BecomeProviderDto, {});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'pixKey')).toBe(true);
  });

  it('rejects pixKey over 77 chars', async () => {
    const dto = plainToInstance(BecomeProviderDto, { pixKey: 'a'.repeat(78) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'pixKey')).toBe(true);
  });

  it('accepts valid pixKey', async () => {
    const dto = plainToInstance(BecomeProviderDto, { pixKey: 'test@email.com' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'pixKey')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd C:\Users\gabry\Documents\tafeito-api
npx jest become-provider.dto.spec --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `BecomeProviderDto` has no validators so `missing pixKey` test fails.

- [ ] **Step 3: Implement validation**

Replace `src/modules/auth/application/dto/become-provider.dto.ts`:

```typescript
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class BecomeProviderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(77)
  pixKey!: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest become-provider.dto.spec --no-coverage 2>&1 | tail -10
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/application/dto/become-provider.dto.ts src/modules/auth/application/dto/become-provider.dto.spec.ts
git commit -m "feat(auth): add validation to BecomeProviderDto (MaxLength 77)"
```

---

### Task 3: Add validation to `CreatePixPaymentDto`

**Files:**
- Modify: `src/modules/payments/application/dto/create-pix-payment.dto.ts`

**Current state (no decorators):**
```typescript
export class CreatePixPaymentDto {
    amount!: number | string;
    payerEmail!: string;
    payerFirstName?: string;
    payerLastName?: string;
    payerDocumentType!: 'CPF' | 'CNPJ';
    payerDocumentNumber!: string;
}
```

- [ ] **Step 1: Write failing test**

File: `src/modules/payments/application/dto/create-pix-payment.dto.spec.ts`

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePixPaymentDto } from './create-pix-payment.dto';

const validBase = {
  amount: 99.90,
  payerEmail: 'user@example.com',
  payerDocumentType: 'CPF',
  payerDocumentNumber: '12345678901',
};

describe('CreatePixPaymentDto', () => {
  it('accepts valid payload', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, validBase);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid email', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, { ...validBase, payerEmail: 'not-an-email' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'payerEmail')).toBe(true);
  });

  it('rejects invalid documentType', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, { ...validBase, payerDocumentType: 'RG' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'payerDocumentType')).toBe(true);
  });

  it('rejects missing amount', async () => {
    const { amount, ...rest } = validBase;
    const dto = plainToInstance(CreatePixPaymentDto, rest);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'amount')).toBe(true);
  });

  it('rejects firstName over 100 chars', async () => {
    const dto = plainToInstance(CreatePixPaymentDto, { ...validBase, payerFirstName: 'a'.repeat(101) });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'payerFirstName')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest create-pix-payment.dto.spec --no-coverage 2>&1 | tail -20
```

Expected: FAIL — no validators, so invalid email/documentType pass through.

- [ ] **Step 3: Implement validation**

Replace `src/modules/payments/application/dto/create-pix-payment.dto.ts`:

```typescript
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePixPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEmail()
  @MaxLength(254)
  payerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payerFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  payerLastName?: string;

  @IsEnum(['CPF', 'CNPJ'])
  payerDocumentType!: 'CPF' | 'CNPJ';

  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  payerDocumentNumber!: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest create-pix-payment.dto.spec --no-coverage 2>&1 | tail -10
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/payments/application/dto/create-pix-payment.dto.ts src/modules/payments/application/dto/create-pix-payment.dto.spec.ts
git commit -m "feat(payments): add validation to CreatePixPaymentDto"
```

---

### Task 4: Run full test suite and verify

- [ ] **Step 1: Run all tests**

```bash
cd C:\Users\gabry\Documents\tafeito-api
npx jest --no-coverage 2>&1 | tail -30
```

Expected: All tests PASS. If existing tests fail due to `forbidNonWhitelisted` + new validation, adjust test fixtures to include required fields.

- [ ] **Step 2: Verify security headers config**

```bash
git show HEAD:src/main.ts
```

Confirm output contains: `helmet()`, `enableCors`, `forbidNonWhitelisted: true`, `httpsOptions`.

- [ ] **Step 3: Final commit with plan doc**

```bash
git add docs/superpowers/plans/2026-05-25-seguranca.md
git commit -m "docs: add segurança implementation plan"
```

---

## Summary of what `segurança` branch contains

| Feature | Status |
|---------|--------|
| InvoicesModule (upload de nota fiscal) | ✅ merged from main |
| ReviewsModule (criar-avaliação) | ✅ merged from main |
| Helmet (security headers) | ✅ implemented |
| CORS (FRONTEND_URL env) | ✅ implemented |
| HTTPS via TLS_KEY_PATH/TLS_CERT_PATH | ✅ implemented |
| ThrottlerGuard global (100 req/60s) | ✅ implemented |
| @Throttle 5 req/60s on login + registration | ✅ implemented |
| ValidationPipe forbidNonWhitelisted | ✅ implemented |
| @MaxLength on all user/auth/review/budget DTOs | ✅ implemented |
| BecomeProviderDto validation | 🔧 Task 2 |
| CreatePixPaymentDto validation | 🔧 Task 3 |

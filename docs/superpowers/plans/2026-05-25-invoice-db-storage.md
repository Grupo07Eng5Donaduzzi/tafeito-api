# Invoice DB Storage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Armazenar o binário da nota fiscal como `bytea` no PostgreSQL e fazer download via `StreamableFile`, removendo dependência de Firebase Storage do módulo de invoices.

**Architecture:** `Invoice` entity troca `filePath: string` por `fileContent: Buffer`. Schema usa `customType` bytea do Drizzle. Service remove Firebase, repositório adiciona `findContentById` para buscar só o buffer no download. Controller retorna `StreamableFile` com headers corretos.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL `bytea`, `drizzle-kit generate`, `StreamableFile` do `@nestjs/common`

---

## File Map

| File | Action |
|------|--------|
| `src/modules/invoices/domain/models/invoice.entity.ts` | Trocar `_filePath: string` → `_fileContent: Buffer` |
| `src/modules/invoices/domain/repositories/invoice-repository.interface.ts` | Adicionar `findContentById` |
| `src/modules/invoices/infra/schemas/invoice.schema.ts` | bytea customType, trocar `filePath` → `fileContent` |
| `drizzle/0012_invoice_bytea.sql` | Gerado por `drizzle-kit generate` |
| `drizzle/meta/_journal.json` | Atualizado por `drizzle-kit generate` |
| `src/modules/invoices/infra/repositories/drizzle-invoice.repository.ts` | Implementar bytea, `findContentById` |
| `src/modules/invoices/application/services/invoice.service.ts` | Remover Firebase, adicionar `download()` |
| `src/modules/invoices/application/services/invoice.service.spec.ts` | Reescrever testes sem Firebase |
| `src/modules/invoices/infra/controllers/invoices.controller.ts` | `StreamableFile` no download |
| `src/modules/invoices/application/dto/invoice.dto.ts` | Remover `DownloadUrlDto` |

---

### Task 1: Atualizar `Invoice` entity (trocar filePath → fileContent)

**Files:**
- Modify: `src/modules/invoices/domain/models/invoice.entity.ts`

- [ ] **Step 1: Reescrever o arquivo completo**

```typescript
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import path from 'path';

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/xml',
  'text/xml',
]);

export const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/xml': 'xml',
  'text/xml': 'xml',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

const SAFE_FILENAME_RE = /[^a-zA-Z0-9._-]/g;
const MAX_FILENAME_LENGTH = 200;

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(SAFE_FILENAME_RE, '_');
  if (!base || base === '.' || base === '..') return 'arquivo';
  return base.slice(0, MAX_FILENAME_LENGTH);
}

export class Invoice {
  private readonly _id: string;
  private _paymentId: string;
  private _fileContent: Buffer;
  private _fileName: string;
  private _fileType: string;
  private _fileSize: number;
  private _uploadedBy: string;
  private readonly _createdAt?: Date;

  private constructor(id: string, createdAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
  }

  get id(): string { return this._id; }
  get paymentId(): string { return this._paymentId; }
  get fileContent(): Buffer { return this._fileContent; }
  get fileName(): string { return this._fileName; }
  get fileType(): string { return this._fileType; }
  get fileSize(): number { return this._fileSize; }
  get uploadedBy(): string { return this._uploadedBy; }
  get createdAt(): Date | undefined { return this._createdAt; }

  static create(props: {
    paymentId: string;
    fileContent: Buffer;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
  }): Invoice {
    if (!ALLOWED_MIME_TYPES.has(props.fileType)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }
    if (props.fileSize <= 0) {
      throw new BadRequestException('Arquivo vazio');
    }
    if (props.fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('Arquivo excede o tamanho máximo de 10MB');
    }
    if (!props.paymentId?.trim() || !props.uploadedBy?.trim()) {
      throw new BadRequestException('paymentId e uploadedBy são obrigatórios');
    }

    const invoice = new Invoice(randomUUID());
    invoice._paymentId = props.paymentId.trim();
    invoice._fileContent = props.fileContent;
    invoice._fileName = sanitizeFileName(props.fileName);
    invoice._fileType = props.fileType;
    invoice._fileSize = props.fileSize;
    invoice._uploadedBy = props.uploadedBy;
    return invoice;
  }

  static restore(props: {
    id: string;
    paymentId: string;
    fileContent: Buffer;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    createdAt: Date;
  }): Invoice {
    const invoice = new Invoice(props.id, props.createdAt);
    invoice._paymentId = props.paymentId;
    invoice._fileContent = props.fileContent;
    invoice._fileName = props.fileName;
    invoice._fileType = props.fileType;
    invoice._fileSize = props.fileSize;
    invoice._uploadedBy = props.uploadedBy;
    return invoice;
  }
}
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
cd C:\Users\gabry\Documents\tafeito-api
npx tsc --noEmit 2>&1 | head -30
```

Esperado: erros sobre `filePath` em outros arquivos — normal, serão corrigidos nas próximas tasks.

---

### Task 2: Atualizar interface do repositório

**Files:**
- Modify: `src/modules/invoices/domain/repositories/invoice-repository.interface.ts`

- [ ] **Step 1: Adicionar `findContentById`**

```typescript
import type { Invoice } from '../models/invoice.entity';

export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');

export interface InvoiceRepository {
  create(invoice: Invoice): Promise<Date>;
  findById(id: string): Promise<Invoice | null>;
  findByPaymentId(paymentId: string): Promise<Invoice[]>;
  findContentById(id: string): Promise<Buffer | null>;
  delete(id: string): Promise<void>;
}
```

---

### Task 3: Atualizar schema Drizzle (bytea)

**Files:**
- Modify: `src/modules/invoices/infra/schemas/invoice.schema.ts`

- [ ] **Step 1: Reescrever com customType bytea**

```typescript
import { pgTable, uuid, text, integer, timestamp, customType } from 'drizzle-orm/pg-core';
import { usersSchema } from '@users/infra/schemas/user.schema';

const bytea = customType<{ data: Buffer; notNull: true; default: false }>({
  dataType() {
    return 'bytea';
  },
});

export const invoicesSchema = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: text('payment_id').notNull(),
  fileContent: bytea('file_content').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadedBy: uuid('uploaded_by')
    .references(() => usersSchema.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
```

---

### Task 4: Gerar e aplicar migration

**Files:**
- Create: `drizzle/0012_<nome_gerado>.sql`
- Modify: `drizzle/meta/_journal.json`, `drizzle/meta/0012_snapshot.json`

- [ ] **Step 1: Gerar migration**

```bash
cd C:\Users\gabry\Documents\tafeito-api
npx drizzle-kit generate
```

Esperado: cria `drizzle/0012_<nome>.sql` com conteúdo:
```sql
ALTER TABLE "invoices" DROP COLUMN "file_path";
ALTER TABLE "invoices" ADD COLUMN "file_content" "bytea" NOT NULL;
```

- [ ] **Step 2: Aplicar migration no banco**

```bash
npx drizzle-kit migrate
```

Esperado: `All migrations ran successfully` (ou similar).

---

### Task 5: Atualizar repositório Drizzle

**Files:**
- Modify: `src/modules/invoices/infra/repositories/drizzle-invoice.repository.ts`

- [ ] **Step 1: Reescrever o repositório**

```typescript
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/infra/database/drizzle.service';
import { Invoice } from '../../domain/models/invoice.entity';
import { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { invoicesSchema } from '../schemas/invoice.schema';

@Injectable()
export class DrizzleInvoiceRepository implements InvoiceRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(invoice: Invoice): Promise<Date> {
    const [row] = await this.drizzleService.db
      .insert(invoicesSchema)
      .values({
        id: invoice.id,
        paymentId: invoice.paymentId,
        fileContent: invoice.fileContent,
        fileName: invoice.fileName,
        fileType: invoice.fileType,
        fileSize: invoice.fileSize,
        uploadedBy: invoice.uploadedBy,
        createdAt: new Date(),
      })
      .returning({ createdAt: invoicesSchema.createdAt });
    return row.createdAt;
  }

  async findById(id: string): Promise<Invoice | null> {
    const result = await this.drizzleService.db
      .select()
      .from(invoicesSchema)
      .where(eq(invoicesSchema.id, id))
      .limit(1);

    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findByPaymentId(paymentId: string): Promise<Invoice[]> {
    const result = await this.drizzleService.db
      .select({
        id: invoicesSchema.id,
        paymentId: invoicesSchema.paymentId,
        fileName: invoicesSchema.fileName,
        fileType: invoicesSchema.fileType,
        fileSize: invoicesSchema.fileSize,
        uploadedBy: invoicesSchema.uploadedBy,
        createdAt: invoicesSchema.createdAt,
      })
      .from(invoicesSchema)
      .where(eq(invoicesSchema.paymentId, paymentId))
      .orderBy(invoicesSchema.createdAt);

    return result.map((row) =>
      Invoice.restore({
        ...row,
        fileContent: Buffer.alloc(0),
      }),
    );
  }

  async findContentById(id: string): Promise<Buffer | null> {
    const result = await this.drizzleService.db
      .select({ fileContent: invoicesSchema.fileContent })
      .from(invoicesSchema)
      .where(eq(invoicesSchema.id, id))
      .limit(1);

    return result[0]?.fileContent ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db
      .delete(invoicesSchema)
      .where(eq(invoicesSchema.id, id));
  }

  private mapToEntity(row: typeof invoicesSchema.$inferSelect): Invoice {
    return Invoice.restore({
      id: row.id,
      paymentId: row.paymentId,
      fileContent: row.fileContent,
      fileName: row.fileName,
      fileType: row.fileType,
      fileSize: row.fileSize,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt,
    });
  }
}
```

---

### Task 6: Reescrever `InvoiceService` e spec

**Files:**
- Modify: `src/modules/invoices/application/services/invoice.service.ts`
- Modify: `src/modules/invoices/application/services/invoice.service.spec.ts`

- [ ] **Step 1: Escrever spec atualizado (TDD — escreve antes)**

Substituir TODO o conteúdo de `invoice.service.spec.ts`:

```typescript
import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { Invoice } from '../../domain/models/invoice.entity';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const PDF_BUFFER = Buffer.concat([
  Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary'),
  Buffer.alloc(64),
]);
const JPEG_BUFFER = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  Buffer.alloc(32),
]);
const XML_BUFFER = Buffer.from('<?xml version="1.0"?><nfe/>', 'utf8');

const mockRepository: jest.Mocked<InvoiceRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByPaymentId: jest.fn(),
  findContentById: jest.fn(),
  delete: jest.fn(),
};

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvoiceService(mockRepository);
  });

  describe('upload', () => {
    it('persists PDF when magic bytes match mime', async () => {
      const persisted = new Date('2026-01-01T00:00:00Z');
      mockRepository.create.mockResolvedValue(persisted);

      const result = await service.upload({
        paymentId: '123',
        file: {
          buffer: PDF_BUFFER,
          originalname: 'nota fiscal.pdf',
          mimetype: 'application/pdf',
          size: PDF_BUFFER.length,
        } as Express.Multer.File,
        uploadedByUserId: 'user-uuid-1',
      });

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result.paymentId).toBe('123');
      expect(result.fileName).toBe('nota_fiscal.pdf');
      expect(result.createdAt).toBe(persisted);
    });

    it('persists JPEG when magic bytes match mime', async () => {
      mockRepository.create.mockResolvedValue(new Date());

      const result = await service.upload({
        paymentId: '123',
        file: {
          buffer: JPEG_BUFFER,
          originalname: 'foto.jpg',
          mimetype: 'image/jpeg',
          size: JPEG_BUFFER.length,
        } as Express.Multer.File,
        uploadedByUserId: 'user-uuid-1',
      });

      expect(result.fileType).toBe('image/jpeg');
    });

    it('accepts XML when content starts with <', async () => {
      mockRepository.create.mockResolvedValue(new Date());

      const result = await service.upload({
        paymentId: '123',
        file: {
          buffer: XML_BUFFER,
          originalname: 'nfe.xml',
          mimetype: 'application/xml',
          size: XML_BUFFER.length,
        } as Express.Multer.File,
        uploadedByUserId: 'user-uuid-1',
      });

      expect(result.fileType).toBe('application/xml');
    });

    it('rejects when declared MIME is not allowed', async () => {
      await expect(
        service.upload({
          paymentId: '123',
          file: {
            buffer: Buffer.from('exe content'),
            originalname: 'malware.exe',
            mimetype: 'application/x-msdownload',
            size: 1024,
          } as Express.Multer.File,
          uploadedByUserId: 'user-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when content does not match declared MIME', async () => {
      await expect(
        service.upload({
          paymentId: '123',
          file: {
            buffer: Buffer.from('not a pdf at all'),
            originalname: 'fake.pdf',
            mimetype: 'application/pdf',
            size: 16,
          } as Express.Multer.File,
          uploadedByUserId: 'user-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects XML when content does not start with <', async () => {
      await expect(
        service.upload({
          paymentId: '123',
          file: {
            buffer: Buffer.from('not xml'),
            originalname: 'fake.xml',
            mimetype: 'application/xml',
            size: 7,
          } as Express.Multer.File,
          uploadedByUserId: 'user-uuid-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listByPayment', () => {
    it('returns only invoices uploaded by the requesting user', async () => {
      const mine = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        fileContent: Buffer.alloc(0),
        fileName: 'a.pdf',
        fileType: 'application/pdf',
        fileSize: 100,
        uploadedBy: 'user-1',
        createdAt: new Date(),
      });
      const someoneElse = Invoice.restore({
        id: 'inv-2',
        paymentId: '123',
        fileContent: Buffer.alloc(0),
        fileName: 'b.pdf',
        fileType: 'application/pdf',
        fileSize: 100,
        uploadedBy: 'user-2',
        createdAt: new Date(),
      });
      mockRepository.findByPaymentId.mockResolvedValue([mine, someoneElse]);

      const result = await service.listByPayment('123', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv-1');
    });
  });

  describe('download', () => {
    it('retorna buffer e metadados quando usuário é o uploader', async () => {
      const invoice = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        fileContent: Buffer.alloc(0),
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user-uuid-1',
        createdAt: new Date(),
      });
      const content = Buffer.from('%PDF content');
      mockRepository.findById.mockResolvedValue(invoice);
      mockRepository.findContentById.mockResolvedValue(content);

      const result = await service.download('inv-1', 'user-uuid-1');

      expect(result.buffer).toBe(content);
      expect(result.fileName).toBe('nota.pdf');
      expect(result.fileType).toBe('application/pdf');
    });

    it('lança ForbiddenException se usuário não é o uploader', async () => {
      const invoice = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        fileContent: Buffer.alloc(0),
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user-uuid-1',
        createdAt: new Date(),
      });
      mockRepository.findById.mockResolvedValue(invoice);

      await expect(service.download('inv-1', 'outro')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lança NotFoundException se invoice não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.download('inv-999', 'u')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deleta invoice se usuário é o uploader', async () => {
      const invoice = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        fileContent: Buffer.alloc(0),
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user-uuid-1',
        createdAt: new Date(),
      });
      mockRepository.findById.mockResolvedValue(invoice);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove('inv-1', 'user-uuid-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('inv-1');
    });

    it('lança ForbiddenException se usuário não é o uploader', async () => {
      const invoice = Invoice.restore({
        id: 'inv-1',
        paymentId: '123',
        fileContent: Buffer.alloc(0),
        fileName: 'nota.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        uploadedBy: 'user-uuid-1',
        createdAt: new Date(),
      });
      mockRepository.findById.mockResolvedValue(invoice);

      await expect(service.remove('inv-1', 'outro-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lança NotFoundException se invoice não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.remove('inv-999', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

- [ ] **Step 2: Rodar testes para confirmar que falham**

```bash
cd C:\Users\gabry\Documents\tafeito-api
npx jest invoice.service.spec --no-coverage 2>&1 | tail -15
```

Esperado: FAIL — `InvoiceService` ainda usa Firebase.

- [ ] **Step 3: Reescrever `invoice.service.ts`**

```typescript
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { fromBuffer } from 'file-type';
import {
  ALLOWED_MIME_TYPES,
  Invoice,
} from '../../domain/models/invoice.entity';
import type { InvoiceRepository } from '../../domain/repositories/invoice-repository.interface';
import { INVOICE_REPOSITORY } from '../../domain/repositories/invoice-repository.interface';
import { InvoiceDto } from '../dto/invoice.dto';

const XML_TEXT_MIMES = new Set(['application/xml', 'text/xml']);

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly repository: InvoiceRepository,
  ) {}

  async upload(params: {
    paymentId: string;
    file: Express.Multer.File;
    uploadedByUserId: string;
  }): Promise<InvoiceDto> {
    const { paymentId, file, uploadedByUserId } = params;

    if (!file?.buffer || !file.mimetype) {
      throw new BadRequestException('Arquivo não enviado');
    }

    await this.assertContentMatchesMime(file);

    const invoice = Invoice.create({
      paymentId,
      fileContent: file.buffer,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: uploadedByUserId,
    });

    const persistedCreatedAt = await this.repository.create(invoice);

    return this.toDto(invoice, persistedCreatedAt);
  }

  async listByPayment(
    paymentId: string,
    requestingUserId: string,
  ): Promise<InvoiceDto[]> {
    const invoices = await this.repository.findByPaymentId(paymentId);
    return invoices
      .filter((inv) => inv.uploadedBy === requestingUserId)
      .map((inv) => this.toDto(inv));
  }

  async download(
    id: string,
    requestingUserId: string,
  ): Promise<{ buffer: Buffer; fileName: string; fileType: string }> {
    const invoice = await this.repository.findById(id);
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');

    if (invoice.uploadedBy !== requestingUserId) {
      throw new ForbiddenException('Sem permissão para acessar esta nota fiscal');
    }

    const buffer = await this.repository.findContentById(id);
    if (!buffer) throw new NotFoundException('Conteúdo não encontrado');

    return { buffer, fileName: invoice.fileName, fileType: invoice.fileType };
  }

  async remove(id: string, requestingUserId: string): Promise<void> {
    const invoice = await this.repository.findById(id);
    if (!invoice) throw new NotFoundException('Nota fiscal não encontrada');

    if (invoice.uploadedBy !== requestingUserId) {
      throw new ForbiddenException('Sem permissão para remover esta nota fiscal');
    }

    await this.repository.delete(id);
  }

  private async assertContentMatchesMime(
    file: Express.Multer.File,
  ): Promise<void> {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    if (XML_TEXT_MIMES.has(file.mimetype)) {
      const head = file.buffer.subarray(0, 256).toString('utf8').trimStart();
      if (!head.startsWith('<')) {
        throw new BadRequestException('Conteúdo XML inválido');
      }
      return;
    }

    const detected = await fromBuffer(file.buffer);
    if (!detected) {
      throw new BadRequestException('Não foi possível verificar o tipo do arquivo');
    }
    if (detected.mime !== file.mimetype) {
      throw new BadRequestException(
        `Conteúdo do arquivo (${detected.mime}) não corresponde ao tipo declarado (${file.mimetype})`,
      );
    }
  }

  private toDto(invoice: Invoice, persistedCreatedAt?: Date): InvoiceDto {
    return {
      id: invoice.id,
      paymentId: invoice.paymentId,
      fileName: invoice.fileName,
      fileType: invoice.fileType,
      fileSize: invoice.fileSize,
      uploadedBy: invoice.uploadedBy,
      createdAt: persistedCreatedAt ?? invoice.createdAt!,
    };
  }
}
```

- [ ] **Step 4: Rodar testes para confirmar que passam**

```bash
npx jest invoice.service.spec --no-coverage 2>&1 | tail -10
```

Esperado: `Tests: 12 passed`

- [ ] **Step 5: Commit**

```bash
git add src/modules/invoices/domain/models/invoice.entity.ts \
        src/modules/invoices/domain/repositories/invoice-repository.interface.ts \
        src/modules/invoices/infra/schemas/invoice.schema.ts \
        src/modules/invoices/infra/repositories/drizzle-invoice.repository.ts \
        src/modules/invoices/application/services/invoice.service.ts \
        src/modules/invoices/application/services/invoice.service.spec.ts
git commit -m "feat(invoices): store file as bytea in PostgreSQL, remove Firebase dependency"
```

---

### Task 7: Atualizar DTO e Controller

**Files:**
- Modify: `src/modules/invoices/application/dto/invoice.dto.ts`
- Modify: `src/modules/invoices/infra/controllers/invoices.controller.ts`

- [ ] **Step 1: Atualizar `invoice.dto.ts` — remover `DownloadUrlDto`**

```typescript
export class InvoiceDto {
  id!: string;
  paymentId!: string;
  fileName!: string;
  fileType!: string;
  fileSize!: number;
  uploadedBy!: string;
  createdAt!: Date;
}
```

- [ ] **Step 2: Reescrever controller com `StreamableFile`**

```typescript
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { InvoiceService } from '../../application/services/invoice.service';
import { MAX_FILE_SIZE } from '../../domain/models/invoice.entity';

const PAYMENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function requireUserId(req: any): string {
  const userId = req.user?.id;
  if (typeof userId !== 'string' || !userId) {
    throw new UnauthorizedException('Usuário não autenticado');
  }
  return userId;
}

function assertPaymentId(value: string): string {
  if (!PAYMENT_ID_RE.test(value)) {
    throw new BadRequestException('paymentId inválido');
  }
  return value;
}

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoiceService) {}

  @Post(':paymentId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    }),
  )
  upload(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = requireUserId(req);
    return this.service.upload({
      paymentId: assertPaymentId(paymentId),
      file,
      uploadedByUserId: userId,
    });
  }

  @Get(':paymentId')
  listByPayment(@Param('paymentId') paymentId: string, @Req() req: any) {
    const userId = requireUserId(req);
    return this.service.listByPayment(assertPaymentId(paymentId), userId);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const userId = requireUserId(req);
    const { buffer, fileName, fileType } = await this.service.download(id, userId);
    res.set({
      'Content-Type': fileType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(buffer.length),
    });
    return new StreamableFile(buffer);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const userId = requireUserId(req);
    return this.service.remove(id, userId);
  }
}
```

- [ ] **Step 3: Rodar suite completa de testes**

```bash
cd C:\Users\gabry\Documents\tafeito-api
npx jest --no-coverage 2>&1 | tail -10
```

Esperado: todos passando.

- [ ] **Step 4: Commit**

```bash
git add src/modules/invoices/application/dto/invoice.dto.ts \
        src/modules/invoices/infra/controllers/invoices.controller.ts \
        docs/superpowers/plans/2026-05-25-invoice-db-storage.md \
        docs/superpowers/specs/2026-05-25-invoice-db-storage-design.md
git commit -m "feat(invoices): stream binary download from PostgreSQL bytea"
```

---

### Task 8: Smoke test manual

- [ ] **Step 1: Confirmar servidor rodando**

```bash
curl -s http://localhost:3000/services | head -c 50
```

Esperado: JSON de serviços (não erro de conexão).

- [ ] **Step 2: Login para obter token**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
echo "TOKEN OK: ${TOKEN:0:20}..."
```

- [ ] **Step 3: Upload de PDF**

Criar arquivo PDF mínimo e fazer upload:

```bash
printf '%PDF-1.4\n%%EOF' > /tmp/test.pdf

curl -s -X POST "http://localhost:3000/invoices/pay-001/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.pdf;type=application/pdf" | python -m json.tool
```

Esperado: JSON com `id`, `paymentId`, `fileName`, `fileType`, `fileSize`, `createdAt`.

- [ ] **Step 4: Download stream**

```bash
INVOICE_ID="<id do step anterior>"

curl -s -X GET "http://localhost:3000/invoices/${INVOICE_ID}/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/downloaded.pdf

file /tmp/downloaded.pdf
```

Esperado: `PDF document` (ou equivalente no Windows: `Get-Item /tmp/downloaded.pdf` mostra o arquivo).

- [ ] **Step 5: Push final**

```bash
cd C:\Users\gabry\Documents\tafeito-api
git push origin segurança
```

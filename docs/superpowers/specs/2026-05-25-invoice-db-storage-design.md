# Invoice DB Storage — Design Spec

**Date:** 2026-05-25
**Scope:** Armazenar conteúdo binário da nota fiscal no PostgreSQL (bytea) em vez do Firebase Storage. Download via stream binário.

---

## Context

Módulo de invoices atualmente:
- Faz upload para Firebase Storage via `FirebaseStorageService`
- Salva apenas o `file_path` (string) no banco
- Download retorna signed URL temporária do Firebase

Novo comportamento: arquivo salvo diretamente como `bytea` no PostgreSQL. Sem dependência de Firebase no módulo de invoices.

---

## Architecture

### Schema (`invoices` table)

| Coluna | Antes | Depois |
|--------|-------|--------|
| `file_path` | `text NOT NULL` | **removida** |
| `file_content` | — | `bytea NOT NULL` |

Drizzle não tem tipo `bytea` built-in — usar `customType` do `drizzle-orm/pg-core`.

### Entity (`Invoice`)

- Remove: `_filePath: string`, getter `filePath`
- Add: `_fileContent: Buffer`, getter `fileContent`
- `Invoice.create()` recebe `fileContent: Buffer` em vez de `filePath: string`
- `Invoice.restore()` idem

### Repository Interface

```typescript
create(invoice: Invoice): Promise<Date>;      // persiste fileContent bytea
findById(id: string): Promise<Invoice | null>;
findByPaymentId(id: string): Promise<Invoice[]>;  // NÃO carrega fileContent (performance)
findContentById(id: string): Promise<Buffer | null>;  // carrega só o content
delete(id: string): Promise<void>;
```

`findByPaymentId` retorna lista sem content (listagem não precisa do binário). `findContentById` carrega o buffer só no download.

### Service (`InvoiceService`)

- `upload()`: salva `file.buffer` via `repository.create(invoice)` — sem Firebase
- Remove `getDownloadUrl()` → `download(id, userId)` retorna `{ buffer: Buffer, fileName: string, fileType: string }`
- `remove()`: só `repository.delete(id)` — sem `storageService.delete()`
- Remove injeção de `FirebaseStorageService`

### Controller (`InvoicesController`)

`GET /invoices/:id/download` → `StreamableFile`:
```typescript
import { StreamableFile } from '@nestjs/common';

@Get(':id/download')
async download(@Param('id', ParseUUIDPipe) id: string, @Req() req: any, @Res({ passthrough: true }) res: Response) {
  const userId = requireUserId(req);
  const { buffer, fileName, fileType } = await this.service.download(id, userId);
  res.set({
    'Content-Type': fileType,
    'Content-Disposition': `attachment; filename="${fileName}"`,
  });
  return new StreamableFile(buffer);
}
```

### Migration

Nova migration Drizzle:
```sql
ALTER TABLE invoices DROP COLUMN file_path;
ALTER TABLE invoices ADD COLUMN file_content bytea NOT NULL;
```

### InvoiceDto

Remove campo `filePath` — irrelevante para o cliente.

---

## Files Changed

| File | Change |
|------|--------|
| `drizzle/XXXX_invoice_bytea.sql` | migration: drop file_path, add file_content bytea |
| `drizzle/meta/_journal.json` | atualizar journal |
| `src/modules/invoices/infra/schemas/invoice.schema.ts` | bytea customType, trocar filePath → fileContent |
| `src/modules/invoices/domain/models/invoice.entity.ts` | trocar filePath → fileContent (Buffer) |
| `src/modules/invoices/domain/repositories/invoice-repository.interface.ts` | adicionar findContentById |
| `src/modules/invoices/infra/repositories/drizzle-invoice.repository.ts` | implementar bytea, findContentById |
| `src/modules/invoices/application/services/invoice.service.ts` | remover Firebase, implementar download() |
| `src/modules/invoices/application/services/invoice.service.spec.ts` | atualizar testes |
| `src/modules/invoices/infra/controllers/invoices.controller.ts` | trocar getDownloadUrl → download com StreamableFile |
| `src/modules/invoices/application/dto/invoice.dto.ts` | remover filePath |
| `src/modules/invoices/invoices.module.ts` | remover FirebaseStorageService |

---

## Out of Scope

- Remover `FirebaseStorageService` do SharedModule (outros módulos podem usar)
- Migração de dados existentes (ambiente dev, sem dados de produção)
- Compressão do binário no banco

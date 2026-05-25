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
  private _fileName: string;
  private _fileType: string;
  private _fileSize: number;
  private _fileData: Buffer;
  private _uploadedBy: string;
  private readonly _createdAt?: Date;

  private constructor(id: string, createdAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
  }

  get id(): string { return this._id; }
  get paymentId(): string { return this._paymentId; }
  get fileName(): string { return this._fileName; }
  get fileType(): string { return this._fileType; }
  get fileSize(): number { return this._fileSize; }
  get fileData(): Buffer { return this._fileData; }
  get uploadedBy(): string { return this._uploadedBy; }
  get createdAt(): Date | undefined { return this._createdAt; }

  static create(props: {
    paymentId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: Buffer;
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
    invoice._fileName = sanitizeFileName(props.fileName);
    invoice._fileType = props.fileType;
    invoice._fileSize = props.fileSize;
    invoice._fileData = props.fileData;
    invoice._uploadedBy = props.uploadedBy;
    return invoice;
  }

  static restore(props: {
    id: string;
    paymentId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: Buffer;
    uploadedBy: string;
    createdAt: Date;
  }): Invoice {
    const invoice = new Invoice(props.id, props.createdAt);
    invoice._paymentId = props.paymentId;
    invoice._fileName = props.fileName;
    invoice._fileType = props.fileType;
    invoice._fileSize = props.fileSize;
    invoice._fileData = props.fileData;
    invoice._uploadedBy = props.uploadedBy;
    return invoice;
  }
}

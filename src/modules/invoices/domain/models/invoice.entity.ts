import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/xml',
  'text/xml',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class Invoice {
  private readonly _id: string;
  private _paymentId: string;
  private _filePath: string;
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
  get filePath(): string { return this._filePath; }
  get fileName(): string { return this._fileName; }
  get fileType(): string { return this._fileType; }
  get fileSize(): number { return this._fileSize; }
  get uploadedBy(): string { return this._uploadedBy; }
  get createdAt(): Date | undefined { return this._createdAt; }

  static create(props: {
    paymentId: string;
    filePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
  }): Invoice {
    if (!ALLOWED_MIME_TYPES.has(props.fileType)) {
      throw new Error('Tipo de arquivo não permitido');
    }
    if (props.fileSize > MAX_FILE_SIZE) {
      throw new Error('Arquivo excede o tamanho máximo de 10MB');
    }

    const invoice = new Invoice(randomUUID());
    invoice._paymentId = props.paymentId;
    invoice._filePath = props.filePath;
    invoice._fileName = props.fileName;
    invoice._fileType = props.fileType;
    invoice._fileSize = props.fileSize;
    invoice._uploadedBy = props.uploadedBy;
    return invoice;
  }

  static restore(props: {
    id: string;
    paymentId: string;
    filePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    createdAt: Date;
  }): Invoice {
    const invoice = new Invoice(props.id, props.createdAt);
    invoice._paymentId = props.paymentId;
    invoice._filePath = props.filePath;
    invoice._fileName = props.fileName;
    invoice._fileType = props.fileType;
    invoice._fileSize = props.fileSize;
    invoice._uploadedBy = props.uploadedBy;
    return invoice;
  }
}

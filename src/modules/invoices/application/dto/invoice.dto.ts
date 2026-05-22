export class InvoiceDto {
  id!: string;
  paymentId!: string;
  fileName!: string;
  fileType!: string;
  fileSize!: number;
  uploadedBy!: string;
  createdAt!: Date;
}

export class DownloadUrlDto {
  downloadUrl!: string;
  expiresAt!: Date;
}

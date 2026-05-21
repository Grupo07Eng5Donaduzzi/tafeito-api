import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

@Injectable()
export class FirebaseStorageService {
  private getBucket() {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new InternalServerErrorException('FIREBASE_STORAGE_BUCKET não configurado');
    }
    return admin.storage().bucket(bucketName);
  }

  async upload(params: {
    buffer: Buffer;
    mimeType: string;
    folder: string;
    extension: string;
  }): Promise<string> {
    const bucket = this.getBucket();
    const fileName = `${params.folder}/${randomUUID()}.${params.extension}`;
    const file = bucket.file(fileName);

    await file.save(params.buffer, {
      metadata: { contentType: params.mimeType },
    });

    return fileName;
  }

  async getSignedUrl(filePath: string, expiresInMs = 3600_000): Promise<string> {
    const bucket = this.getBucket();
    const file = bucket.file(filePath);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
    return url;
  }

  async delete(filePath: string): Promise<void> {
    const bucket = this.getBucket();
    const file = bucket.file(filePath);
    await file.delete({ ignoreNotFound: true });
  }
}

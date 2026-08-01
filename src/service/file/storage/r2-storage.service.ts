import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'node:path';
import { v4 as uuid } from 'uuid';
import { ConfigInterface } from '../../../config-module/configuration';
import { FileType } from '../../../model/enum/file-type.enum';
import { StorageProvider } from '../../../model/enum/storage-provider.enum';
import {
  FileStorage,
  SignedFileUrl,
  StoredFileResult,
} from './file-storage.interface';

@Injectable()
export class R2StorageService implements FileStorage {
  private readonly client: S3Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly publicBaseUrl: string;
  private readonly signedUrlTtlSeconds: number;

  constructor(configService: ConfigService<ConfigInterface>) {
    const config = configService.get('r2', { infer: true });
    if (!config) {
      throw new Error('Missing Cloudflare R2 configuration');
    }

    this.publicBucket = config.publicBucket;
    this.privateBucket = config.privateBucket;
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/+$/, '');
    this.signedUrlTtlSeconds = config.signedUrlTtlSeconds;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    fileType: FileType,
    isPublic: boolean,
  ): Promise<StoredFileResult> {
    const bucket = isPublic ? this.publicBucket : this.privateBucket;
    const objectKey = this.createObjectKey(fileType, file.originalname);

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        ContentDisposition: this.createContentDisposition(file.originalname),
        CacheControl: isPublic
          ? 'public, max-age=31536000, immutable'
          : 'private, no-store',
        Metadata: {
          originalfilename: encodeURIComponent(file.originalname),
          filetype: fileType,
        },
      }),
    );

    return {
      storageProvider: StorageProvider.CLOUDFLARE_R2,
      bucket,
      objectKey,
      url: isPublic ? `${this.publicBaseUrl}/${objectKey}` : null,
    };
  }

  async createSignedDownloadUrl(
    bucket: string,
    objectKey: string,
    originalFileName?: string | null,
  ): Promise<SignedFileUrl> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ResponseContentDisposition: originalFileName
        ? this.createContentDisposition(originalFileName)
        : undefined,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: this.signedUrlTtlSeconds,
    });

    return {
      url,
      expiresAt: new Date(Date.now() + this.signedUrlTtlSeconds * 1000),
    };
  }

  private createObjectKey(
    fileType: FileType,
    originalFileName: string,
  ): string {
    const now = new Date();
    const extension = this.safeExtension(originalFileName);
    return [
      fileType.toLowerCase().replaceAll('_', '-'),
      now.getUTCFullYear().toString(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      `${uuid()}${extension}`,
    ].join('/');
  }

  private safeExtension(originalFileName: string): string {
    const extension = extname(originalFileName).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : '';
  }

  private createContentDisposition(originalFileName: string): string {
    return `inline; filename*=UTF-8''${encodeURIComponent(originalFileName)}`;
  }
}

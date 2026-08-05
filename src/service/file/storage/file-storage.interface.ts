import { FileType } from '../../../model/enum/file-type.enum';
import { StorageProvider } from '../../../model/enum/storage-provider.enum';

export interface StoredFileResult {
  storageProvider: StorageProvider;
  bucket: string;
  objectKey: string;
  url: string | null;
}

export interface SignedFileUrl {
  url: string;
  expiresAt: Date | null;
}

export interface FileStorage {
  upload(
    file: Express.Multer.File,
    fileType: FileType,
    isPublic: boolean,
  ): Promise<StoredFileResult>;

  createSignedDownloadUrl(
    bucket: string,
    objectKey: string,
    originalFileName?: string | null,
  ): Promise<SignedFileUrl>;
}

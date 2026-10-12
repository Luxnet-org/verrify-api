import { ConfigService } from '@nestjs/config';
import { S3Disk, StorageModuleOptions } from '@nestjs/storage';
import { ConfigInterface } from '../../../config-module/configuration';

export const createStorageOptions = (
  configService: ConfigService<ConfigInterface>,
): StorageModuleOptions => {
  const r2 = configService.getOrThrow('r2', { infer: true });
  const options = {
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
    },
  };

  return {
    default: 'r2-private',
    disks: {
      'r2-public': new S3Disk({
        ...options,
        bucket: r2.publicBucket,
        publicUrl: r2.publicBaseUrl.replace(/\/+$/, ''),
      }),
      'r2-private': new S3Disk({ ...options, bucket: r2.privateBucket }),
    },
  };
};

import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from '../../config-module/configuration';
import { v2 as CloudinaryAPI } from 'cloudinary';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<ConfigInterface>) => {
    return CloudinaryAPI.config({
      cloud_name: configService.get('cloudinary.cloudName', { infer: true }),
      api_key: configService.get('cloudinary.apiKey', { infer: true }),
      api_secret: configService.get('cloudinary.apiSecret', { infer: true }),
    });
  },
};

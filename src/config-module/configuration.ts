import * as Joi from 'joi';
import * as process from 'node:process';

export interface ConfigInterface {
  app: {
    env: 'dev' | 'prod' | 'test';
    frontendHost: string;
    origin: string;
  };
  database: {
    username: string;
    password: string;
    name: string;
    type: string;
    host: string;
    port: number;
  };
  email: {
    username: string;
    password: string;
    host: string;
    port: number;
    sender: string;
  };
  queue: {
    rabbitMQUri: string;
  };
  token: {
    secret: string;
    jwtExpire: string;
    refreshExpire: number;
  };
  verification: {
    expire: number;
  };
  logs: {
    filePath: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

export const validationSchema = Joi.object({
  APP_PROFILE: Joi.string().valid('dev', 'prod', 'test').default('dev'),
  FRONTEND_HOST: Joi.string().required(),
  ORIGIN: Joi.string().required(),

  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_TYPE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),

  EMAIL_USERNAME: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().port().required(),
  EMAIL_SENDER: Joi.string().required(),

  RABBITMQ_URI: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRE: Joi.string().required(),
  REFRESH_EXPIRE: Joi.number().required(),

  VERIFICATION_EXPIRE: Joi.number().required(),

  LOG_FILE_PATH: Joi.string().required(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
});

export const configuration = (): ConfigInterface => ({
  app: {
    env: (process.env.APP_PROFILE || 'dev') as ConfigInterface['app']['env'],
    frontendHost: process.env.FRONTEND_HOST!,
    origin: process.env.ORIGIN!,
  },
  database: {
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
    type: process.env.DB_TYPE!,
    host: process.env.DB_HOST!,
    port: +process.env.DB_PORT!,
  },
  email: {
    username: process.env.EMAIL_USERNAME!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.EMAIL_HOST!,
    port: +process.env.EMAIL_PORT!,
    sender: process.env.EMAIL_SENDER!,
  },
  queue: {
    rabbitMQUri: process.env.RABBITMQ_URI!,
  },
  token: {
    secret: process.env.JWT_SECRET!,
    jwtExpire: process.env.JWT_EXPIRE!,
    refreshExpire: +process.env.REFRESH_EXPIRE!,
  },
  verification: {
    expire: +process.env.VERIFICATION_EXPIRE!,
  },
  logs: {
    filePath: process.env.LOG_FILE_PATH!,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },
});

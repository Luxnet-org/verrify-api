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
    provider: 'resend' | 'smtp';
    resendAPIKey: string;
    username: string;
    password: string;
    host: string;
    port: number;
    sender: string;
    adminEmail: string;
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
  google: {
    clientMail: string;
    privateKey: string;
    sheetsId: string;
    sheetsName: string;
  };
  paystack: {
    publicKey: string;
    secretKey: string;
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

  EMAIL_PROVIDER: Joi.string().valid('resend', 'smtp').required(),
  EMAIL_RESEND_API_KEY: Joi.string().when('EMAIL_PROVIDER', {
    is: 'resend',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  EMAIL_USERNAME: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  EMAIL_PASSWORD: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  EMAIL_HOST: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  EMAIL_PORT: Joi.number().port().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_SENDER: Joi.string().required(),
  ADMIN_EMAIL: Joi.string().required(),

  RABBITMQ_URI: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRE: Joi.string().required(),
  REFRESH_EXPIRE: Joi.number().required(),

  VERIFICATION_EXPIRE: Joi.number().required(),

  LOG_FILE_PATH: Joi.string().required(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  GOOGLE_CLIENT_EMAIL: Joi.string().required(),
  GOOGLE_PRIVATE_KEY: Joi.string().required(),
  GOOGLE_SHEET_ID: Joi.string().required(),
  GOOGLE_SHEET_NAME: Joi.string().required(),

  PAYSTACK_PUBLIC_KEY: Joi.string().required(),
  PAYSTACK_SECRET_KEY: Joi.string().required(),
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
    resendAPIKey: process.env.EMAIL_RESEND_API_KEY!,
    provider: (process.env.EMAIL_PROVIDER || 'smtp') as ConfigInterface['email']['provider'],
    username: process.env.EMAIL_USERNAME!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.EMAIL_HOST!,
    port: +process.env.EMAIL_PORT!,
    sender: process.env.EMAIL_SENDER!,
    adminEmail: process.env.ADMIN_EMAIL!,
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
  google: {
    clientMail: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!,
    sheetsId: process.env.GOOGLE_SHEET_ID!,
    sheetsName: process.env.GOOGLE_SHEET_NAME!,
  },
  paystack: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
    secretKey: process.env.PAYSTACK_SECRET_KEY!,
  },
});

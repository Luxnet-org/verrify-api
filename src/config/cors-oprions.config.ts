export const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://lux-net-product-4nqb.vercel.app/',
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Accept',
    'Authorization',
    'Origin',
    'X-Requested-With',
  ],
  exposedHeaders: ['Authorization'],
};

export const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://lux-net-product-zflr.vercel.app',
    'https://lux-net-product.vercel.app',
    'https://verrifyproduct.vercel.app',
    'https://verrifyproduct-kpvx.vercel.app',
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

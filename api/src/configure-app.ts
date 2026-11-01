import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { fileURLToPath } from 'node:url';

export const UPLOADS_DIR = fileURLToPath(new URL('../uploads', import.meta.url));

/** Shared app setup for the server entrypoint and e2e tests. */
export function configureApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'HEAD', 'OPTIONS'],
  });
  app.useStaticAssets(UPLOADS_DIR, {
    prefix: '/uploads/',
    dotfiles: 'deny',
    index: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    },
  });
  app.disable('x-powered-by');
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { isOriginAllowed, parseWebUrlList } from './core/auth/http/auth-http';
import { parseTrustProxyHops } from './core/config/trust-proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance() as {
    disable?: (key: string) => void;
    set?: (key: string, value: unknown) => void;
  };
  instance.disable?.('etag');
  instance.set?.(
    'trust proxy',
    parseTrustProxyHops(process.env.TRUST_PROXY_HOPS),
  );
  app.use(
    helmet({
      // O frontend carrega avatares/anexos/logo direto via <img src> num
      // domínio diferente do backend (ver item 1 da auditoria). O padrão
      // do helmet ("same-origin") bloquearia esse carregamento.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  const allowedOrigins = parseWebUrlList(process.env.WEB_URL);
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin, allowedOrigins));
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

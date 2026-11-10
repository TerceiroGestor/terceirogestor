import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isOriginAllowed, parseWebUrlList } from './core/auth/http/auth-http';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance() as {
    disable?: (key: string) => void;
  };
  instance.disable?.('etag');
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

// Must be the very first import in main.ts - Sentry needs to patch Node
// internals before anything else in the app loads. See
// https://docs.sentry.io/platforms/javascript/guides/nestjs/.
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT?.trim() ||
      process.env.NODE_ENV ||
      'development',
  });
}

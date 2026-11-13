import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import * as Sentry from '@sentry/nestjs';
import { from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../request-context/request-context.service';
import { StorageService } from './storage.service';
import {
  PUBLIC_UPLOAD_CATEGORIES,
  SENSITIVE_UPLOAD_CATEGORIES,
  UPLOAD_PATH_PATTERN,
} from './upload-paths';

interface SignContext {
  tenantId: string;
  userId: string;
  /** personId of the closest ancestor object that had its own `personId`
   * field - e.g. a PersonHealthCondition row signing its documentUrl. */
  personId?: string;
}

/**
 * Rewrites every raw `/uploads/<category>/<tenantId>/<file>` string in a
 * response body into a short-lived signed download URL for the caller's
 * own tenant, so the frontend's plain <img src>/<a href> usage keeps
 * working without the caller needing to attach an Authorization header.
 * See docs/auditoria-riscos.md item 1. Async because minting that URL is
 * (`StorageService.getSignedUrl`) - the `local` driver signs its own proxy
 * URL synchronously under the hood, but the `r2` driver presigns a real
 * S3 request, which the SDK only exposes as a Promise.
 *
 * For sensitive categories (health documents, item 2) this is also the
 * one place that writes the LGPD access log: once a signed URL exists,
 * the file is accessible for its whole TTL regardless of whether this API
 * sees the actual download request afterwards (it doesn't, for `r2` -
 * the browser downloads straight from the bucket), so "a signed URL was
 * minted for this person's document" is the only reliable access event to
 * log, for either driver.
 */
@Injectable()
export class SignUploadsInterceptor implements NestInterceptor {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const user = request.user;

    return next.handle().pipe(
      switchMap((data: unknown) =>
        user
          ? from(
              this.signDeep(data, {
                tenantId: user.tenantId,
                userId: user.userId,
              }),
            )
          : of(data),
      ),
    );
  }

  private async signDeep(value: unknown, ctx: SignContext): Promise<unknown> {
    if (typeof value === 'string') {
      return this.signIfUploadPath(value, ctx);
    }
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => this.signDeep(item, ctx)));
    }
    // Only recurse into plain objects - Decimal/Date/Buffer and other
    // class instances pass through untouched so their own serialization
    // (toJSON, etc.) isn't disturbed.
    if (
      value !== null &&
      typeof value === 'object' &&
      value.constructor === Object
    ) {
      const record = value as Record<string, unknown>;
      const ownPersonId =
        typeof record.personId === 'string' ? record.personId : undefined;
      const childCtx: SignContext = ownPersonId
        ? { ...ctx, personId: ownPersonId }
        : ctx;

      const entries = await Promise.all(
        Object.entries(record).map(
          async ([key, entry]) =>
            [key, await this.signDeep(entry, childCtx)] as const,
        ),
      );
      return Object.fromEntries(entries);
    }
    return value;
  }

  private async signIfUploadPath(
    value: string,
    ctx: SignContext,
  ): Promise<string> {
    const match = UPLOAD_PATH_PATTERN.exec(value);
    if (!match) return value;
    const [, category, pathTenantId, filename] = match;
    if (PUBLIC_UPLOAD_CATEGORIES.has(category)) return value;
    // Every value reaching here came from a tenant-scoped query, so this
    // should never actually mismatch - failing closed (leave unsigned, so
    // the download 404s) instead of signing a URL for the wrong tenant.
    if (pathTenantId !== ctx.tenantId) return value;

    const url = await this.storage.getSignedUrl(
      category,
      filename,
      ctx.tenantId,
      ctx.userId,
    );

    if (SENSITIVE_UPLOAD_CATEGORIES.has(category) && ctx.personId) {
      await this.logSensitiveAccess(ctx.tenantId, ctx.personId, ctx.userId);
    }

    return url;
  }

  private async logSensitiveAccess(
    tenantId: string,
    personId: string,
    userId: string,
  ) {
    try {
      const requestCtx = this.requestContext.get();
      await this.prisma.personSensitiveAccessLog.create({
        data: {
          tenantId,
          personId,
          userId,
          action: 'READ',
          ipAddress: requestCtx?.ipAddress ?? null,
          userAgent: requestCtx?.userAgent ?? null,
        },
      });
    } catch (error) {
      // A logging failure must not block the response that triggered it
      // (same defensive stance as PrismaService#safeAuditLog).
      console.warn('PersonSensitiveAccessLog failed', error);
      Sentry.captureException(error);
    }
  }
}

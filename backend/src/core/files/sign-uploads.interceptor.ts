import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { JwtUser } from '../auth/strategies/jwt.strategy';
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
 * Rewrites every raw `/uploads/<category>/<file>` string in a response
 * body into a short-lived signed URL for the caller's own tenant, so the
 * frontend's plain <img src>/<a href> usage keeps working without the
 * caller needing to attach an Authorization header. See
 * docs/auditoria-riscos.md item 1.
 *
 * For sensitive categories (health documents, item 2) it also carries the
 * owning person's id in the token, read from a `personId` field on the
 * same object as the path - every PersonHealthCondition/PersonMedication
 * response already has one as a sibling of `documentUrl` - so the
 * download endpoint can write the LGPD access log without a DB lookup.
 */
@Injectable()
export class SignUploadsInterceptor implements NestInterceptor {
  constructor(private readonly storage: StorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const user = request.user;

    return next.handle().pipe(
      map((data: unknown) =>
        user
          ? this.signDeep(data, {
              tenantId: user.tenantId,
              userId: user.userId,
            })
          : data,
      ),
    );
  }

  private signDeep(value: unknown, ctx: SignContext): unknown {
    if (typeof value === 'string') {
      return this.signIfUploadPath(value, ctx);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.signDeep(item, ctx));
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

      const out: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(record)) {
        out[key] = this.signDeep(entry, childCtx);
      }
      return out;
    }
    return value;
  }

  private signIfUploadPath(value: string, ctx: SignContext): string {
    const match = UPLOAD_PATH_PATTERN.exec(value);
    if (!match) return value;
    const [, category, filename] = match;
    if (PUBLIC_UPLOAD_CATEGORIES.has(category)) return value;

    const personId = SENSITIVE_UPLOAD_CATEGORIES.has(category)
      ? ctx.personId
      : undefined;
    return this.storage.getSignedUrl(
      category,
      filename,
      ctx.tenantId,
      ctx.userId,
      {
        personId,
      },
    );
  }
}

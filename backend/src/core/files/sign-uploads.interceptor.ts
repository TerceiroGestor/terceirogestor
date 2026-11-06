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
import { PUBLIC_UPLOAD_CATEGORIES, UPLOAD_PATH_PATTERN } from './upload-paths';

/**
 * Rewrites every raw `/uploads/<category>/<file>` string in a response
 * body into a short-lived signed URL for the caller's own tenant, so the
 * frontend's plain <img src>/<a href> usage keeps working without the
 * caller needing to attach an Authorization header. See
 * docs/auditoria-riscos.md item 1.
 */
@Injectable()
export class SignUploadsInterceptor implements NestInterceptor {
  constructor(private readonly storage: StorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const tenantId = request.user?.tenantId;

    return next
      .handle()
      .pipe(
        map((data: unknown) =>
          tenantId ? this.signDeep(data, tenantId) : data,
        ),
      );
  }

  private signDeep(value: unknown, tenantId: string): unknown {
    if (typeof value === 'string') {
      return this.signIfUploadPath(value, tenantId);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.signDeep(item, tenantId));
    }
    // Only recurse into plain objects - Decimal/Date/Buffer and other
    // class instances pass through untouched so their own serialization
    // (toJSON, etc.) isn't disturbed.
    if (
      value !== null &&
      typeof value === 'object' &&
      value.constructor === Object
    ) {
      const out: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(
        value as Record<string, unknown>,
      )) {
        out[key] = this.signDeep(entry, tenantId);
      }
      return out;
    }
    return value;
  }

  private signIfUploadPath(value: string, tenantId: string): string {
    const match = UPLOAD_PATH_PATTERN.exec(value);
    if (!match) return value;
    const [, category, filename] = match;
    if (PUBLIC_UPLOAD_CATEGORIES.has(category)) return value;
    return this.storage.getSignedUrl(category, filename, tenantId);
  }
}

import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  PUBLIC_UPLOAD_CATEGORIES,
  SAFE_UPLOAD_SEGMENT,
  UPLOAD_CATEGORY_DIRS,
} from './upload-paths';
import { StorageService } from './storage.service';

/**
 * Replaces the old ServeStaticModule mount for /uploads. Only reachable
 * for `STORAGE_DRIVER=local` signed URLs - `r2` mints its own presigned
 * URL straight to the bucket (see storage.service.ts), so this controller
 * never sees that traffic. Every category except `tenants` (public
 * login/branding logo, see upload-paths.ts) requires the `sig` query
 * token minted by SignUploadsInterceptor for the requesting tenant - a
 * cross-tenant request, an expired link, or a tampered filename all fail
 * the same way (404), matching the TenancyMiddleware convention of not
 * revealing whether the resource exists.
 */
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Get(':category/:tenantId/:filename')
  // async on purpose even with no current `await`: `verifySignature` stays
  // synchronous for the `local` driver, but keeping this handler's shape
  // Promise-based avoids a breaking signature change the day it needs one.
  // eslint-disable-next-line @typescript-eslint/require-await
  async download(
    @Param('category') category: string,
    @Param('tenantId') tenantId: string,
    @Param('filename') filename: string,
    @Query('sig') sig: string | undefined,
    @Res() res: Response,
  ) {
    const dir = UPLOAD_CATEGORY_DIRS[category];
    if (
      !dir ||
      !SAFE_UPLOAD_SEGMENT.test(tenantId) ||
      !SAFE_UPLOAD_SEGMENT.test(filename)
    ) {
      throw new NotFoundException();
    }

    // For protected categories, the URL's tenantId segment is purely
    // informational - the signature's own payload.tenantId is what the
    // physical path actually resolves with below, so tampering with the
    // segment alone can't redirect a valid signature to another tenant's
    // folder. Still required to match, so a mismatched URL fails the same
    // (404) way as every other invalid request here.
    let resolvedTenantId = tenantId;

    if (!PUBLIC_UPLOAD_CATEGORIES.has(category)) {
      const payload = this.storage.verifySignature(category, filename, sig);
      if (!payload || payload.tenantId !== tenantId) {
        throw new NotFoundException();
      }
      resolvedTenantId = payload.tenantId;
    }

    const absolutePath = join(dir, resolvedTenantId, filename);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException();
    }

    res.sendFile(absolutePath);
  }
}

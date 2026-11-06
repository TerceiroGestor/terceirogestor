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
 * Replaces the old ServeStaticModule mount for /uploads. Every category
 * except `tenants` (public login/branding logo, see upload-paths.ts) now
 * requires the `sig` query token minted by SignUploadsInterceptor for the
 * requesting tenant - a cross-tenant request, an expired link, or a
 * tampered filename all fail the same way (404), matching the
 * TenancyMiddleware convention of not revealing whether the resource
 * exists.
 */
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Get(':category/:filename')
  download(
    @Param('category') category: string,
    @Param('filename') filename: string,
    @Query('sig') sig: string | undefined,
    @Res() res: Response,
  ) {
    const dir = UPLOAD_CATEGORY_DIRS[category];
    if (!dir || !SAFE_UPLOAD_SEGMENT.test(filename)) {
      throw new NotFoundException();
    }

    if (!PUBLIC_UPLOAD_CATEGORIES.has(category)) {
      const payload = this.storage.verifySignature(category, filename, sig);
      if (!payload) {
        throw new NotFoundException();
      }
    }

    const absolutePath = join(dir, filename);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException();
    }

    res.sendFile(absolutePath);
  }
}

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
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../request-context/request-context.service';
import {
  PUBLIC_UPLOAD_CATEGORIES,
  SAFE_UPLOAD_SEGMENT,
  SENSITIVE_UPLOAD_CATEGORIES,
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
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  @Get(':category/:filename')
  async download(
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

      if (SENSITIVE_UPLOAD_CATEGORIES.has(category) && payload.personId) {
        await this.logSensitiveDownload(
          payload.tenantId,
          payload.personId,
          payload.userId,
        );
      }
    }

    const absolutePath = join(dir, filename);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException();
    }

    res.sendFile(absolutePath);
  }

  private async logSensitiveDownload(
    tenantId: string,
    personId: string,
    userId: string,
  ) {
    const ctx = this.requestContext.get();
    await this.prisma.personSensitiveAccessLog.create({
      data: {
        tenantId,
        personId,
        userId,
        action: 'READ',
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
      },
    });
  }
}

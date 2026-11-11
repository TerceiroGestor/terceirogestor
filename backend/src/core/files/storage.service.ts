import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import * as fs from 'fs';
import { dirname, join } from 'path';
import { UPLOAD_CATEGORY_DIRS } from './upload-paths';

interface SignedUploadPayload {
  tenantId: string;
  userId: string;
  category: string;
  filename: string;
  personId?: string;
  exp: number;
}

export interface SignedUploadUrlOptions {
  ttlSeconds?: number;
  /** Person the file belongs to - only set for sensitive categories, so a
   * download can be written to PersonSensitiveAccessLog (item 2). */
  personId?: string;
}

export interface VerifiedUploadSignature {
  tenantId: string;
  userId: string;
  personId?: string;
}

const DEFAULT_TTL_SECONDS = 5 * 60;

/**
 * Where `put`/`delete` actually write bytes. `local` writes straight to
 * the container's disk (lost on every Railway redeploy — item 12 of
 * docs/auditoria-riscos.md); swapping to R2 (Parte 4.2) only needs a new
 * class here and `STORAGE_DRIVER=r2`, no caller changes.
 */
export interface StorageDriver {
  put(
    category: string,
    tenantId: string,
    filename: string,
    data: Buffer,
  ): Promise<void>;
  delete(category: string, tenantId: string, filename: string): Promise<void>;
}

class LocalStorageDriver implements StorageDriver {
  // async on purpose: resolve() below can throw synchronously (unknown
  // category) and async is what turns that into a rejected Promise,
  // matching how a real (genuinely awaited) R2 driver will behave.
  // eslint-disable-next-line @typescript-eslint/require-await
  async put(
    category: string,
    tenantId: string,
    filename: string,
    data: Buffer,
  ): Promise<void> {
    const filePath = this.resolve(category, tenantId, filename);
    fs.mkdirSync(dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data);
  }

  // see put() above
  // eslint-disable-next-line @typescript-eslint/require-await
  async delete(
    category: string,
    tenantId: string,
    filename: string,
  ): Promise<void> {
    fs.rmSync(this.resolve(category, tenantId, filename), { force: true });
  }

  private resolve(category: string, tenantId: string, filename: string): string {
    const dir = UPLOAD_CATEGORY_DIRS[category];
    if (!dir) {
      throw new Error(`Categoria de upload desconhecida: ${category}`);
    }
    return join(dir, tenantId, filename);
  }
}

/**
 * Local-disk stand-in for the R2 StorageService planned for Parte 4.2.
 * `getSignedUrl`/`verifySignature` sign short-lived download URLs so the
 * browser can keep using plain <img src>/<a href> (the access token lives
 * only in sessionStorage, never in a cookie, so it can't ride along
 * automatically on those requests) while still requiring proof of tenant
 * ownership. `put`/`delete` are the write side (item 12): every upload
 * endpoint in `files.controller.ts` goes through them instead of touching
 * the filesystem directly, so there's exactly one place to change when R2
 * is ready.
 */
@Injectable()
export class StorageService {
  private driver: StorageDriver | null = null;

  constructor(private readonly config: ConfigService) {}

  // async on purpose: getDriver() can throw synchronously (unimplemented
  // driver) and async is what turns that into a rejected Promise instead
  // of a thrown error, so callers can just `await` + try/catch either way.
  async put(
    category: string,
    tenantId: string,
    filename: string,
    data: Buffer,
  ): Promise<void> {
    return this.getDriver().put(category, tenantId, filename, data);
  }

  // see put() above
  async delete(
    category: string,
    tenantId: string,
    filename: string,
  ): Promise<void> {
    return this.getDriver().delete(category, tenantId, filename);
  }

  private getDriver(): StorageDriver {
    if (!this.driver) {
      const name = this.config.get<string>('STORAGE_DRIVER')?.trim() || 'local';
      if (name !== 'local') {
        throw new Error(
          `Storage driver "${name}" ainda não foi implementado (Parte 4.2 — R2). Use STORAGE_DRIVER=local.`,
        );
      }
      this.driver = new LocalStorageDriver();
    }
    return this.driver;
  }

  private secret(): string {
    const value = this.config.get<string>('JWT_SECRET');
    if (!value) {
      throw new Error('JWT_SECRET is not set');
    }
    return value;
  }

  getSignedUrl(
    category: string,
    filename: string,
    tenantId: string,
    userId: string,
    options: SignedUploadUrlOptions = {},
  ): string {
    const payload: SignedUploadPayload = {
      tenantId,
      userId,
      category,
      filename,
      personId: options.personId,
      exp: Date.now() + (options.ttlSeconds ?? DEFAULT_TTL_SECONDS) * 1000,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const mac = createHmac('sha256', this.secret())
      .update(body)
      .digest('base64url');
    return `/uploads/${category}/${tenantId}/${filename}?sig=${body}.${mac}`;
  }

  verifySignature(
    category: string,
    filename: string,
    sig: string | undefined,
  ): VerifiedUploadSignature | null {
    if (!sig) return null;
    const [body, mac] = sig.split('.');
    if (!body || !mac) return null;

    const expectedMac = createHmac('sha256', this.secret())
      .update(body)
      .digest('base64url');
    const macBuf = Buffer.from(mac);
    const expectedBuf = Buffer.from(expectedMac);
    if (
      macBuf.length !== expectedBuf.length ||
      !timingSafeEqual(macBuf, expectedBuf)
    ) {
      return null;
    }

    let payload: SignedUploadPayload;
    try {
      payload = JSON.parse(
        Buffer.from(body, 'base64url').toString(),
      ) as SignedUploadPayload;
    } catch {
      return null;
    }

    if (
      !payload ||
      payload.category !== category ||
      payload.filename !== filename ||
      typeof payload.exp !== 'number' ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    return {
      tenantId: payload.tenantId,
      userId: payload.userId,
      personId: payload.personId,
    };
  }
}

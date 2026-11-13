import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import * as fs from 'fs';
import { dirname, join } from 'path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { UPLOAD_CATEGORY_DIRS } from './upload-paths';

interface SignedUploadPayload {
  tenantId: string;
  userId: string;
  category: string;
  filename: string;
  exp: number;
}

export interface SignedUploadUrlOptions {
  ttlSeconds?: number;
}

export interface VerifiedUploadSignature {
  tenantId: string;
  userId: string;
}

const DEFAULT_TTL_SECONDS = 5 * 60;

/**
 * Where `put`/`delete`/`getSignedUrl` actually touch bytes. `local` writes
 * straight to the container's disk and signs its own `/uploads/...` proxy
 * URL (lost on every Railway redeploy — item 12 of docs/auditoria-riscos.md).
 * `r2` (Parte 4.2) stores in the R2 bucket and signs a native presigned
 * GET URL for it, so the browser downloads straight from R2, never through
 * this API.
 */
export interface StorageDriver {
  put(
    category: string,
    tenantId: string,
    filename: string,
    data: Buffer,
  ): Promise<void>;
  delete(category: string, tenantId: string, filename: string): Promise<void>;
  getSignedUrl(
    category: string,
    filename: string,
    tenantId: string,
    userId: string,
    options: SignedUploadUrlOptions,
  ): Promise<string>;
}

function storageKey(category: string, tenantId: string, filename: string) {
  return `${category}/${tenantId}/${filename}`;
}

class LocalStorageDriver implements StorageDriver {
  constructor(private readonly secret: string) {}

  // async on purpose: resolve() below can throw synchronously (unknown
  // category) and async is what turns that into a rejected Promise,
  // matching how the real R2 driver behaves (every call is genuinely async).
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

  // see put() above
  // eslint-disable-next-line @typescript-eslint/require-await
  async getSignedUrl(
    category: string,
    filename: string,
    tenantId: string,
    userId: string,
    options: SignedUploadUrlOptions,
  ): Promise<string> {
    const payload: SignedUploadPayload = {
      tenantId,
      userId,
      category,
      filename,
      exp: Date.now() + (options.ttlSeconds ?? DEFAULT_TTL_SECONDS) * 1000,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const mac = createHmac('sha256', this.secret)
      .update(body)
      .digest('base64url');
    return `/uploads/${category}/${tenantId}/${filename}?sig=${body}.${mac}`;
  }

  private resolve(
    category: string,
    tenantId: string,
    filename: string,
  ): string {
    const dir = UPLOAD_CATEGORY_DIRS[category];
    if (!dir) {
      throw new Error(`Categoria de upload desconhecida: ${category}`);
    }
    return join(dir, tenantId, filename);
  }
}

class R2StorageDriver implements StorageDriver {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async put(
    category: string,
    tenantId: string,
    filename: string,
    data: Buffer,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey(category, tenantId, filename),
        Body: data,
      }),
    );
  }

  async delete(
    category: string,
    tenantId: string,
    filename: string,
  ): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey(category, tenantId, filename),
      }),
    );
  }

  async getSignedUrl(
    category: string,
    filename: string,
    tenantId: string,
    _userId: string,
    options: SignedUploadUrlOptions,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey(category, tenantId, filename),
    });
    return getS3SignedUrl(this.client, command, {
      expiresIn: options.ttlSeconds ?? DEFAULT_TTL_SECONDS,
    });
  }
}

/**
 * Storage abstraction planned for Parte 4.2. `put`/`delete` are the write
 * side (item 12 of docs/auditoria-riscos.md): every upload endpoint in
 * `files.controller.ts` goes through them instead of touching the
 * filesystem directly. `getSignedUrl` is the read side: `local` mints its
 * own short-lived proxy URL (verified by `verifySignature` + served by
 * `UploadsController`); `r2` mints a native presigned R2 GET URL instead,
 * so a sensitive download never passes through this API - the permission
 * check (and, for sensitive categories, the LGPD access log) happens once,
 * up front, when `SignUploadsInterceptor` mints the URL, not on every byte
 * fetched afterwards.
 */
@Injectable()
export class StorageService {
  private driver: StorageDriver | null = null;

  constructor(private readonly config: ConfigService) {}

  async put(
    category: string,
    tenantId: string,
    filename: string,
    data: Buffer,
  ): Promise<void> {
    return this.getDriver().put(category, tenantId, filename, data);
  }

  async delete(
    category: string,
    tenantId: string,
    filename: string,
  ): Promise<void> {
    return this.getDriver().delete(category, tenantId, filename);
  }

  async getSignedUrl(
    category: string,
    filename: string,
    tenantId: string,
    userId: string,
    options: SignedUploadUrlOptions = {},
  ): Promise<string> {
    return this.getDriver().getSignedUrl(
      category,
      filename,
      tenantId,
      userId,
      options,
    );
  }

  private getDriver(): StorageDriver {
    if (!this.driver) {
      const name = this.config.get<string>('STORAGE_DRIVER')?.trim() || 'local';
      if (name === 'local') {
        this.driver = new LocalStorageDriver(this.secret());
      } else if (name === 'r2') {
        this.driver = this.createR2Driver();
      } else {
        throw new Error(
          `Storage driver "${name}" não é suportado. Use STORAGE_DRIVER=local ou STORAGE_DRIVER=r2.`,
        );
      }
    }
    return this.driver;
  }

  private createR2Driver(): R2StorageDriver {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID')?.trim();
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config
      .get<string>('R2_SECRET_ACCESS_KEY')
      ?.trim();
    const bucket = this.config.get<string>('R2_BUCKET')?.trim();
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'STORAGE_DRIVER=r2 requer R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET.',
      );
    }
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    return new R2StorageDriver(client, bucket);
  }

  private secret(): string {
    const value = this.config.get<string>('JWT_SECRET');
    if (!value) {
      throw new Error('JWT_SECRET is not set');
    }
    return value;
  }

  /**
   * Verifies a signed URL minted by the `local` driver. Only meaningful for
   * that driver: `UploadsController` (the only caller) is itself only
   * reachable for local-driver URLs - an `r2` signed URL points straight at
   * the R2 bucket and never reaches this API.
   */
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
    };
  }
}

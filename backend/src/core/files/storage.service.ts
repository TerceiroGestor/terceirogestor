import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

interface SignedUploadPayload {
  tenantId: string;
  category: string;
  filename: string;
  exp: number;
}

const DEFAULT_TTL_SECONDS = 5 * 60;

/**
 * Minimal local-disk stand-in for the R2 StorageService planned for Parte
 * 4.2 (`getSignedUrl`). Signs short-lived download URLs so the browser can
 * keep using plain <img src>/<a href> (the access token lives only in
 * sessionStorage, never in a cookie, so it can't ride along automatically
 * on those requests) while still requiring proof of tenant ownership.
 */
@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

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
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): string {
    const payload: SignedUploadPayload = {
      tenantId,
      category,
      filename,
      exp: Date.now() + ttlSeconds * 1000,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const mac = createHmac('sha256', this.secret())
      .update(body)
      .digest('base64url');
    return `/uploads/${category}/${filename}?sig=${body}.${mac}`;
  }

  verifySignature(
    category: string,
    filename: string,
    sig: string | undefined,
  ): { tenantId: string } | null {
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

    return { tenantId: payload.tenantId };
  }
}

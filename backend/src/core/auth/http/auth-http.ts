import type { Request } from 'express';

export type AuthRequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export const REFRESH_COOKIE_NAME = 'refresh_token';

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * WEB_URL holds one or more allowed frontend origins, comma-separated
 * (used as the CORS allowlist). Call sites that need a single URL — the
 * cookie policy, password-reset/OAuth redirect links — use the first one.
 */
export function parseWebUrlList(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

export function getPrimaryWebUrl(
  raw: string | undefined | null = process.env.WEB_URL,
): string {
  return parseWebUrlList(raw)[0] ?? '';
}

export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  return !origin || allowedOrigins.includes(origin);
}

export function isSecureCookiesEnabled() {
  const webUrl = getPrimaryWebUrl();
  if (webUrl.startsWith('https://')) {
    return true;
  }
  if (webUrl.startsWith('http://')) {
    return false;
  }
  return isProduction();
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isSecureCookiesEnabled(),
    path: '/',
  };
}

export function getCookie(req: Request, name: string) {
  const cookieHeader = req.headers.cookie ?? '';
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return null;
  return found.slice(name.length + 1);
}

export function getRequestMeta(req: Request): AuthRequestMeta {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

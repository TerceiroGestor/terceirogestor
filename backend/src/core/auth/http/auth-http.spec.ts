import {
  getPrimaryWebUrl,
  isOriginAllowed,
  isSecureCookiesEnabled,
  parseWebUrlList,
} from './auth-http';

describe('parseWebUrlList', () => {
  it('splits a comma-separated list and trims each entry', () => {
    expect(
      parseWebUrlList(
        'https://terceirogestor.com.br, https://www.terceirogestor.com.br ',
      ),
    ).toEqual([
      'https://terceirogestor.com.br',
      'https://www.terceirogestor.com.br',
    ]);
  });

  it('returns a single-item list for a single origin', () => {
    expect(parseWebUrlList('http://localhost:3000')).toEqual([
      'http://localhost:3000',
    ]);
  });

  it('drops empty entries and handles undefined/null/empty input', () => {
    expect(parseWebUrlList('https://a.com,,https://b.com,')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
    expect(parseWebUrlList(undefined)).toEqual([]);
    expect(parseWebUrlList(null)).toEqual([]);
    expect(parseWebUrlList('')).toEqual([]);
  });
});

describe('getPrimaryWebUrl', () => {
  it('returns the first origin of a comma-separated list', () => {
    expect(getPrimaryWebUrl('https://a.com,https://b.com')).toBe(
      'https://a.com',
    );
  });

  it('returns an empty string when no origin is configured', () => {
    expect(getPrimaryWebUrl('')).toBe('');
    expect(getPrimaryWebUrl(undefined)).toBe('');
  });
});

describe('isOriginAllowed (CORS)', () => {
  const allowed = ['https://terceirogestor.com.br'];

  it('allows an origin present in the allowlist', () => {
    expect(isOriginAllowed('https://terceirogestor.com.br', allowed)).toBe(
      true,
    );
  });

  it('rejects an origin absent from the allowlist', () => {
    expect(isOriginAllowed('https://evil.example', allowed)).toBe(false);
  });

  it('rejects a reused allowed origin with a different scheme/port', () => {
    expect(isOriginAllowed('http://terceirogestor.com.br', allowed)).toBe(
      false,
    );
  });

  it('allows requests with no Origin header (non-browser clients)', () => {
    expect(isOriginAllowed(undefined, allowed)).toBe(true);
  });

  it('rejects every origin when the allowlist is empty', () => {
    expect(isOriginAllowed('https://terceirogestor.com.br', [])).toBe(false);
  });
});

describe('isSecureCookiesEnabled', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('is secure when the primary WEB_URL is https', () => {
    process.env.WEB_URL = 'https://terceirogestor.com.br';
    expect(isSecureCookiesEnabled()).toBe(true);
  });

  it('is not secure when the primary WEB_URL is http, even with other https entries', () => {
    process.env.WEB_URL = 'http://localhost:3000,https://terceirogestor.com.br';
    expect(isSecureCookiesEnabled()).toBe(false);
  });
});

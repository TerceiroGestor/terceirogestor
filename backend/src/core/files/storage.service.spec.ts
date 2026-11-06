import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

function makeService(secret = 'test-secret') {
  return new StorageService({
    get: () => secret,
  } as unknown as ConfigService);
}

describe('StorageService', () => {
  it('signs a URL and verifies it for the same tenant/category/filename', () => {
    const service = makeService();
    const url = service.getSignedUrl('health', 'doc.pdf', 'tenant-a', 'user-a');
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(url.startsWith('/uploads/health/doc.pdf?sig=')).toBe(true);
    expect(
      service.verifySignature('health', 'doc.pdf', sig ?? undefined),
    ).toEqual({
      tenantId: 'tenant-a',
      userId: 'user-a',
      personId: undefined,
    });
  });

  it('carries the personId for sensitive categories', () => {
    const service = makeService();
    const url = service.getSignedUrl(
      'health',
      'doc.pdf',
      'tenant-a',
      'user-a',
      {
        personId: 'person-x',
      },
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(
      service.verifySignature('health', 'doc.pdf', sig ?? undefined),
    ).toEqual({
      tenantId: 'tenant-a',
      userId: 'user-a',
      personId: 'person-x',
    });
  });

  it('rejects a signature issued for a different tenant file that gets reused on another category/filename', () => {
    const service = makeService();
    const url = service.getSignedUrl(
      'health',
      'doc-a.pdf',
      'tenant-a',
      'user-a',
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(
      service.verifySignature('health', 'doc-b.pdf', sig ?? undefined),
    ).toBeNull();
    expect(
      service.verifySignature('people', 'doc-a.pdf', sig ?? undefined),
    ).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const service = makeService();
    const url = service.getSignedUrl(
      'people',
      'file.jpg',
      'tenant-a',
      'user-a',
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig') ?? '';
    const [body] = sig.split('.');
    const tampered = `${body}.${'0'.repeat(43)}`;

    expect(service.verifySignature('people', 'file.jpg', tampered)).toBeNull();
  });

  it('rejects a signature minted with a different secret', () => {
    const issuer = makeService('secret-1');
    const verifier = makeService('secret-2');
    const url = issuer.getSignedUrl('people', 'file.jpg', 'tenant-a', 'user-a');
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(
      verifier.verifySignature('people', 'file.jpg', sig ?? undefined),
    ).toBeNull();
  });

  it('rejects an expired signature', () => {
    const service = makeService();
    const url = service.getSignedUrl(
      'people',
      'file.jpg',
      'tenant-a',
      'user-a',
      {
        ttlSeconds: -1,
      },
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(
      service.verifySignature('people', 'file.jpg', sig ?? undefined),
    ).toBeNull();
  });

  it('rejects a missing or malformed signature', () => {
    const service = makeService();

    expect(service.verifySignature('people', 'file.jpg', undefined)).toBeNull();
    expect(
      service.verifySignature('people', 'file.jpg', 'not-a-valid-token'),
    ).toBeNull();
  });
});

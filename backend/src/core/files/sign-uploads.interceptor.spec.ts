import { CallHandler, ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { SignUploadsInterceptor } from './sign-uploads.interceptor';
import { StorageService } from './storage.service';

function makeContext(user?: { tenantId: string }): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(data: unknown): CallHandler {
  return { handle: () => of(data) } as CallHandler;
}

describe('SignUploadsInterceptor', () => {
  const storage = new StorageService({
    get: () => 'test-secret',
  } as unknown as ConfigService);
  const interceptor = new SignUploadsInterceptor(storage);

  function run(data: unknown, user?: { tenantId: string }): Promise<unknown> {
    return new Promise((resolve) => {
      interceptor
        .intercept(makeContext(user), makeHandler(data))
        .subscribe((value) => resolve(value));
    });
  }

  it('signs a protected upload path nested inside an object, using the caller tenant', async () => {
    const result = (await run(
      { id: '1', filePath: '/uploads/people/abc.pdf' },
      { tenantId: 'tenant-a' },
    )) as { filePath: string };

    expect(result.filePath.startsWith('/uploads/people/abc.pdf?sig=')).toBe(
      true,
    );
    const sig = new URL(result.filePath, 'http://local').searchParams.get(
      'sig',
    );
    expect(
      storage.verifySignature('people', 'abc.pdf', sig ?? undefined),
    ).toEqual({
      tenantId: 'tenant-a',
    });
  });

  it('signs upload paths inside arrays (e.g. ProjectAction.photoPaths)', async () => {
    const result = (await run(
      { photoPaths: ['/uploads/actions/1.jpg', '/uploads/actions/2.jpg'] },
      { tenantId: 'tenant-a' },
    )) as { photoPaths: string[] };

    expect(result.photoPaths).toHaveLength(2);
    for (const path of result.photoPaths) {
      expect(path).toMatch(/^\/uploads\/actions\/\d\.jpg\?sig=/);
    }
  });

  it('leaves public categories (tenant logo) unsigned', async () => {
    const result = (await run(
      { logoUrl: '/uploads/tenants/logo.png' },
      { tenantId: 'tenant-a' },
    )) as { logoUrl: string };

    expect(result.logoUrl).toBe('/uploads/tenants/logo.png');
  });

  it('leaves strings that are not upload paths untouched', async () => {
    const result = (await run(
      { name: '/uploads looks like a path but is not one' },
      { tenantId: 'tenant-a' },
    )) as { name: string };

    expect(result.name).toBe('/uploads looks like a path but is not one');
  });

  it('does not sign anything when the request has no authenticated tenant', async () => {
    const result = (await run(
      { filePath: '/uploads/people/abc.pdf' },
      undefined,
    )) as { filePath: string };

    expect(result.filePath).toBe('/uploads/people/abc.pdf');
  });

  it('does not choke on Date/Decimal-like class instances', async () => {
    class FakeDecimal {
      constructor(public value: string) {}
    }
    const amount = new FakeDecimal('10.50');
    const createdAt = new Date('2026-01-01T00:00:00Z');

    const result = (await run(
      { amount, createdAt, filePath: '/uploads/deposit/x.pdf' },
      { tenantId: 'tenant-a' },
    )) as { amount: FakeDecimal; createdAt: Date; filePath: string };

    expect(result.amount).toBe(amount);
    expect(result.createdAt).toBe(createdAt);
    expect(result.filePath.startsWith('/uploads/deposit/x.pdf?sig=')).toBe(
      true,
    );
  });
});

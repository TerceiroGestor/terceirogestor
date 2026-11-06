import { CallHandler, ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { SignUploadsInterceptor } from './sign-uploads.interceptor';
import { StorageService } from './storage.service';

type TestUser = { tenantId: string; userId: string };

function makeContext(user?: TestUser): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(data: unknown): CallHandler {
  return { handle: () => of(data) } as CallHandler;
}

const USER: TestUser = { tenantId: 'tenant-a', userId: 'user-a' };

describe('SignUploadsInterceptor', () => {
  const storage = new StorageService({
    get: () => 'test-secret',
  } as unknown as ConfigService);
  const interceptor = new SignUploadsInterceptor(storage);

  function run(data: unknown, user?: TestUser): Promise<unknown> {
    return new Promise((resolve) => {
      interceptor
        .intercept(makeContext(user), makeHandler(data))
        .subscribe((value) => resolve(value));
    });
  }

  it('signs a protected upload path nested inside an object, using the caller tenant/user', async () => {
    const result = (await run(
      { id: '1', filePath: '/uploads/people/abc.pdf' },
      USER,
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
      userId: 'user-a',
      personId: undefined,
    });
  });

  it('signs upload paths inside arrays (e.g. ProjectAction.photoPaths)', async () => {
    const result = (await run(
      { photoPaths: ['/uploads/actions/1.jpg', '/uploads/actions/2.jpg'] },
      USER,
    )) as { photoPaths: string[] };

    expect(result.photoPaths).toHaveLength(2);
    for (const path of result.photoPaths) {
      expect(path).toMatch(/^\/uploads\/actions\/\d\.jpg\?sig=/);
    }
  });

  it('leaves public categories (tenant logo) unsigned', async () => {
    const result = (await run(
      { logoUrl: '/uploads/tenants/logo.png' },
      USER,
    )) as { logoUrl: string };

    expect(result.logoUrl).toBe('/uploads/tenants/logo.png');
  });

  it('leaves strings that are not upload paths untouched', async () => {
    const result = (await run(
      { name: '/uploads looks like a path but is not one' },
      USER,
    )) as { name: string };

    expect(result.name).toBe('/uploads looks like a path but is not one');
  });

  it('does not sign anything when the request has no authenticated user', async () => {
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
      USER,
    )) as { amount: FakeDecimal; createdAt: Date; filePath: string };

    expect(result.amount).toBe(amount);
    expect(result.createdAt).toBe(createdAt);
    expect(result.filePath.startsWith('/uploads/deposit/x.pdf?sig=')).toBe(
      true,
    );
  });

  it('carries personId into a sensitive (health) document URL signed as a sibling field', async () => {
    const result = (await run(
      {
        id: 'cond-1',
        personId: 'person-x',
        documentUrl: '/uploads/health/doc.pdf',
      },
      USER,
    )) as { documentUrl: string };

    const sig = new URL(result.documentUrl, 'http://local').searchParams.get(
      'sig',
    );
    expect(
      storage.verifySignature('health', 'doc.pdf', sig ?? undefined),
    ).toEqual({ tenantId: 'tenant-a', userId: 'user-a', personId: 'person-x' });
  });

  it('does not carry personId into a non-sensitive category even if present as a sibling field', async () => {
    const result = (await run(
      {
        id: 'att-1',
        personId: 'person-x',
        filePath: '/uploads/people/file.pdf',
      },
      USER,
    )) as { filePath: string };

    const sig = new URL(result.filePath, 'http://local').searchParams.get(
      'sig',
    );
    expect(
      storage.verifySignature('people', 'file.pdf', sig ?? undefined),
    ).toEqual({ tenantId: 'tenant-a', userId: 'user-a', personId: undefined });
  });

  it('propagates personId from a parent object down to a nested sensitive path (medication record)', async () => {
    const result = (await run(
      {
        personId: 'person-y',
        medication: {
          documentUrl: '/uploads/health/med.pdf',
          permissionDocumentUrl: '/uploads/health/perm.pdf',
        },
      },
      USER,
    )) as {
      medication: { documentUrl: string; permissionDocumentUrl: string };
    };

    for (const url of [
      result.medication.documentUrl,
      result.medication.permissionDocumentUrl,
    ]) {
      const sig = new URL(url, 'http://local').searchParams.get('sig');
      const filename = url.includes('perm.pdf') ? 'perm.pdf' : 'med.pdf';
      expect(
        storage.verifySignature('health', filename, sig ?? undefined),
      ).toEqual({
        tenantId: 'tenant-a',
        userId: 'user-a',
        personId: 'person-y',
      });
    }
  });
});

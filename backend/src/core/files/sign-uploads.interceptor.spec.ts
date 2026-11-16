import { CallHandler, ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { SignUploadsInterceptor } from './sign-uploads.interceptor';
import { StorageService } from './storage.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RequestContextService } from '../request-context/request-context.service';

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
    get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
  } as unknown as ConfigService);
  let createSensitiveLog: jest.Mock;
  let prisma: PrismaService;
  let requestContext: RequestContextService;
  let interceptor: SignUploadsInterceptor;

  beforeEach(() => {
    createSensitiveLog = jest.fn().mockResolvedValue(undefined);
    prisma = {
      personSensitiveAccessLog: { create: createSensitiveLog },
    } as unknown as PrismaService;
    requestContext = {
      get: () => ({ ipAddress: '203.0.113.1', userAgent: 'jest' }),
    } as unknown as RequestContextService;
    interceptor = new SignUploadsInterceptor(storage, prisma, requestContext);
  });

  function run(data: unknown, user?: TestUser): Promise<unknown> {
    return new Promise((resolve) => {
      interceptor
        .intercept(makeContext(user), makeHandler(data))
        .subscribe((value) => resolve(value));
    });
  }

  it('signs a protected upload path nested inside an object, using the caller tenant/user', async () => {
    const result = (await run(
      { id: '1', filePath: '/uploads/people/tenant-a/abc.pdf' },
      USER,
    )) as { filePath: string };

    expect(
      result.filePath.startsWith('/uploads/people/tenant-a/abc.pdf?sig='),
    ).toBe(true);
    const sig = new URL(result.filePath, 'http://local').searchParams.get(
      'sig',
    );
    expect(
      storage.verifySignature('people', 'abc.pdf', sig ?? undefined),
    ).toEqual({
      tenantId: 'tenant-a',
      userId: 'user-a',
    });
  });

  it('signs upload paths inside arrays (e.g. Meeting.photoPaths)', async () => {
    const result = (await run(
      {
        photoPaths: [
          '/uploads/actions/tenant-a/1.jpg',
          '/uploads/actions/tenant-a/2.jpg',
        ],
      },
      USER,
    )) as { photoPaths: string[] };

    expect(result.photoPaths).toHaveLength(2);
    for (const path of result.photoPaths) {
      expect(path).toMatch(/^\/uploads\/actions\/tenant-a\/\d\.jpg\?sig=/);
    }
  });

  it('does not sign a path whose embedded tenantId does not match the caller', async () => {
    const result = (await run(
      { filePath: '/uploads/people/tenant-b/abc.pdf' },
      USER,
    )) as { filePath: string };

    expect(result.filePath).toBe('/uploads/people/tenant-b/abc.pdf');
  });

  it('leaves public categories (tenant logo) unsigned', async () => {
    const result = (await run(
      { logoUrl: '/uploads/tenants/tenant-a/logo.png' },
      USER,
    )) as { logoUrl: string };

    expect(result.logoUrl).toBe('/uploads/tenants/tenant-a/logo.png');
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
      { filePath: '/uploads/people/tenant-a/abc.pdf' },
      undefined,
    )) as { filePath: string };

    expect(result.filePath).toBe('/uploads/people/tenant-a/abc.pdf');
  });

  it('does not choke on Date/Decimal-like class instances', async () => {
    class FakeDecimal {
      constructor(public value: string) {}
    }
    const amount = new FakeDecimal('10.50');
    const createdAt = new Date('2026-01-01T00:00:00Z');

    const result = (await run(
      { amount, createdAt, filePath: '/uploads/deposit/tenant-a/x.pdf' },
      USER,
    )) as { amount: FakeDecimal; createdAt: Date; filePath: string };

    expect(result.amount).toBe(amount);
    expect(result.createdAt).toBe(createdAt);
    expect(
      result.filePath.startsWith('/uploads/deposit/tenant-a/x.pdf?sig='),
    ).toBe(true);
  });

  it('signs a sensitive (health) document URL and writes a PersonSensitiveAccessLog row, using personId from the sibling field', async () => {
    const result = (await run(
      {
        id: 'cond-1',
        personId: 'person-x',
        documentUrl: '/uploads/health/tenant-a/doc.pdf',
      },
      USER,
    )) as { documentUrl: string };

    const sig = new URL(result.documentUrl, 'http://local').searchParams.get(
      'sig',
    );
    expect(
      storage.verifySignature('health', 'doc.pdf', sig ?? undefined),
    ).toEqual({ tenantId: 'tenant-a', userId: 'user-a' });
    expect(createSensitiveLog).toHaveBeenCalledTimes(1);
    expect(createSensitiveLog).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        personId: 'person-x',
        userId: 'user-a',
        action: 'READ',
        ipAddress: '203.0.113.1',
        userAgent: 'jest',
      },
    });
  });

  it('does not log access for a non-sensitive category even if personId is present as a sibling field', async () => {
    const result = (await run(
      {
        id: 'att-1',
        personId: 'person-x',
        filePath: '/uploads/people/tenant-a/file.pdf',
      },
      USER,
    )) as { filePath: string };

    const sig = new URL(result.filePath, 'http://local').searchParams.get(
      'sig',
    );
    expect(
      storage.verifySignature('people', 'file.pdf', sig ?? undefined),
    ).toEqual({ tenantId: 'tenant-a', userId: 'user-a' });
    expect(createSensitiveLog).not.toHaveBeenCalled();
  });

  it('does not log access for a sensitive category with no personId anywhere in the chain', async () => {
    await run(
      { id: 'cond-1', documentUrl: '/uploads/health/tenant-a/doc.pdf' },
      USER,
    );

    expect(createSensitiveLog).not.toHaveBeenCalled();
  });

  it('propagates personId from a parent object down to a nested sensitive path (medication record), logging each one', async () => {
    const result = (await run(
      {
        personId: 'person-y',
        medication: {
          documentUrl: '/uploads/health/tenant-a/med.pdf',
          permissionDocumentUrl: '/uploads/health/tenant-a/perm.pdf',
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
      });
    }
    expect(createSensitiveLog).toHaveBeenCalledTimes(2);
  });

  it('does not fail the response when writing the access log throws', async () => {
    createSensitiveLog.mockRejectedValue(new Error('db down'));

    const result = (await run(
      {
        id: 'cond-1',
        personId: 'person-x',
        documentUrl: '/uploads/health/tenant-a/doc.pdf',
      },
      USER,
    )) as { documentUrl: string };

    expect(result.documentUrl).toContain('?sig=');
  });
});

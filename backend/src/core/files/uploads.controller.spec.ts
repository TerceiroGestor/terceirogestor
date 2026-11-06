import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { UploadsController } from './uploads.controller';
import { StorageService } from './storage.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RequestContextService } from '../request-context/request-context.service';

jest.mock('fs', () => ({ existsSync: jest.fn() }));

function makeRes() {
  const sendFile = jest.fn();
  const res = { sendFile } as unknown as Response;
  return { res, sendFile };
}

describe('UploadsController', () => {
  let storage: StorageService;
  let createSensitiveLog: jest.Mock;
  let prisma: PrismaService;
  let requestContext: RequestContextService;
  let controller: UploadsController;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new StorageService({
      get: () => 'test-secret',
    } as unknown as ConfigService);
    createSensitiveLog = jest.fn().mockResolvedValue(undefined);
    prisma = {
      personSensitiveAccessLog: { create: createSensitiveLog },
    } as unknown as PrismaService;
    requestContext = {
      get: () => ({ ipAddress: '203.0.113.1', userAgent: 'jest' }),
    } as unknown as RequestContextService;
    controller = new UploadsController(storage, prisma, requestContext);
    (existsSync as jest.Mock).mockReturnValue(true);
  });

  it('serves a public category (tenant logo) without any signature', async () => {
    const { res, sendFile } = makeRes();
    await controller.download('tenants', 'logo.png', undefined, res);
    expect(sendFile).toHaveBeenCalledTimes(1);
  });

  it('rejects a protected category with no signature', async () => {
    const { res, sendFile } = makeRes();
    await expect(
      controller.download('health', 'doc.pdf', undefined, res),
    ).rejects.toThrow(NotFoundException);
    expect(sendFile).not.toHaveBeenCalled();
  });

  it('rejects a signature minted for a different tenant/file (cross-tenant leak)', async () => {
    const { res, sendFile } = makeRes();
    const urlForTenantA = storage.getSignedUrl(
      'health',
      'doc.pdf',
      'tenant-a',
      'user-a',
    );
    const sigForOtherFile = new URL(
      urlForTenantA,
      'http://local',
    ).searchParams.get('sig');
    // Same signature, requested against a different filename than it was issued for.
    await expect(
      controller.download(
        'health',
        'other-doc.pdf',
        sigForOtherFile ?? undefined,
        res,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(sendFile).not.toHaveBeenCalled();
    expect(createSensitiveLog).not.toHaveBeenCalled();
  });

  it('serves a protected, non-sensitive category with a valid signature and does not audit-log it', async () => {
    const { res, sendFile } = makeRes();
    const url = storage.getSignedUrl('people', 'doc.pdf', 'tenant-a', 'user-a');
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    await controller.download('people', 'doc.pdf', sig ?? undefined, res);
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(createSensitiveLog).not.toHaveBeenCalled();
  });

  it('serves a health document and writes a PersonSensitiveAccessLog row when the signature carries a personId', async () => {
    const { res, sendFile } = makeRes();
    const url = storage.getSignedUrl(
      'health',
      'doc.pdf',
      'tenant-a',
      'user-a',
      {
        personId: 'person-x',
      },
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    await controller.download('health', 'doc.pdf', sig ?? undefined, res);

    expect(sendFile).toHaveBeenCalledTimes(1);
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

  it('serves a health document without auditing when the signature has no personId', async () => {
    const { res, sendFile } = makeRes();
    const url = storage.getSignedUrl('health', 'doc.pdf', 'tenant-a', 'user-a');
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    await controller.download('health', 'doc.pdf', sig ?? undefined, res);

    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(createSensitiveLog).not.toHaveBeenCalled();
  });

  it('rejects an unknown category', async () => {
    const { res } = makeRes();
    await expect(
      controller.download('not-a-real-category', 'x.png', undefined, res),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a filename with path traversal characters', async () => {
    const { res } = makeRes();
    await expect(
      controller.download('tenants', '..%2F..%2Fetc%2Fpasswd', undefined, res),
    ).rejects.toThrow(NotFoundException);
    await expect(
      controller.download('tenants', '../../etc/passwd', undefined, res),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns 404 when the signature is valid but the file is missing on disk', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    const { res } = makeRes();

    await expect(
      controller.download('tenants', 'logo.png', undefined, res),
    ).rejects.toThrow(NotFoundException);
  });
});

import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { UploadsController } from './uploads.controller';
import { StorageService } from './storage.service';

jest.mock('fs', () => ({ existsSync: jest.fn() }));

function makeRes() {
  const sendFile = jest.fn();
  const res = { sendFile } as unknown as Response;
  return { res, sendFile };
}

describe('UploadsController', () => {
  let storage: StorageService;
  let controller: UploadsController;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new StorageService({
      get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
    } as unknown as ConfigService);
    controller = new UploadsController(storage);
    (existsSync as jest.Mock).mockReturnValue(true);
  });

  it('serves a public category (tenant logo) without any signature', async () => {
    const { res, sendFile } = makeRes();
    await controller.download(
      'tenants',
      'tenant-a',
      'logo.png',
      undefined,
      res,
    );
    expect(sendFile).toHaveBeenCalledTimes(1);
  });

  it('rejects a protected category with no signature', async () => {
    const { res, sendFile } = makeRes();
    await expect(
      controller.download('health', 'tenant-a', 'doc.pdf', undefined, res),
    ).rejects.toThrow(NotFoundException);
    expect(sendFile).not.toHaveBeenCalled();
  });

  it('rejects a signature minted for a different tenant/file (cross-tenant leak)', async () => {
    const { res, sendFile } = makeRes();
    const urlForTenantA = await storage.getSignedUrl(
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
        'tenant-a',
        'other-doc.pdf',
        sigForOtherFile ?? undefined,
        res,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(sendFile).not.toHaveBeenCalled();
  });

  it('rejects a valid signature when the URL tenantId segment does not match it', async () => {
    const { res, sendFile } = makeRes();
    const url = await storage.getSignedUrl(
      'health',
      'doc.pdf',
      'tenant-a',
      'user-a',
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    await expect(
      controller.download(
        'health',
        'tenant-b',
        'doc.pdf',
        sig ?? undefined,
        res,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(sendFile).not.toHaveBeenCalled();
  });

  it('serves a protected category with a valid signature', async () => {
    const { res, sendFile } = makeRes();
    const url = await storage.getSignedUrl(
      'people',
      'doc.pdf',
      'tenant-a',
      'user-a',
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    await controller.download(
      'people',
      'tenant-a',
      'doc.pdf',
      sig ?? undefined,
      res,
    );
    expect(sendFile).toHaveBeenCalledTimes(1);
  });

  it('serves a health document with a valid signature', async () => {
    const { res, sendFile } = makeRes();
    const url = await storage.getSignedUrl(
      'health',
      'doc.pdf',
      'tenant-a',
      'user-a',
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    await controller.download(
      'health',
      'tenant-a',
      'doc.pdf',
      sig ?? undefined,
      res,
    );

    expect(sendFile).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown category', async () => {
    const { res } = makeRes();
    await expect(
      controller.download(
        'not-a-real-category',
        'tenant-a',
        'x.png',
        undefined,
        res,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a filename with path traversal characters', async () => {
    const { res } = makeRes();
    await expect(
      controller.download(
        'tenants',
        'tenant-a',
        '..%2F..%2Fetc%2Fpasswd',
        undefined,
        res,
      ),
    ).rejects.toThrow(NotFoundException);
    await expect(
      controller.download(
        'tenants',
        'tenant-a',
        '../../etc/passwd',
        undefined,
        res,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects a tenantId segment with path traversal characters', async () => {
    const { res } = makeRes();
    await expect(
      controller.download('tenants', '../../etc', 'logo.png', undefined, res),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns 404 when the signature is valid but the file is missing on disk', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    const { res } = makeRes();

    await expect(
      controller.download('tenants', 'tenant-a', 'logo.png', undefined, res),
    ).rejects.toThrow(NotFoundException);
  });
});

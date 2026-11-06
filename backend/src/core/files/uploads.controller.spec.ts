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
      get: () => 'test-secret',
    } as unknown as ConfigService);
    controller = new UploadsController(storage);
    (existsSync as jest.Mock).mockReturnValue(true);
  });

  it('serves a public category (tenant logo) without any signature', () => {
    const { res, sendFile } = makeRes();
    controller.download('tenants', 'logo.png', undefined, res);
    expect(sendFile).toHaveBeenCalledTimes(1);
  });

  it('rejects a protected category with no signature', () => {
    const { res, sendFile } = makeRes();
    expect(() =>
      controller.download('health', 'doc.pdf', undefined, res),
    ).toThrow(NotFoundException);
    expect(sendFile).not.toHaveBeenCalled();
  });

  it('rejects a signature minted for a different tenant/file (cross-tenant leak)', () => {
    const { res, sendFile } = makeRes();
    const urlForTenantA = storage.getSignedUrl('health', 'doc.pdf', 'tenant-a');
    const sigForOtherFile = new URL(
      urlForTenantA,
      'http://local',
    ).searchParams.get('sig');
    // Same signature, requested against a different filename than it was issued for.
    expect(() =>
      controller.download(
        'health',
        'other-doc.pdf',
        sigForOtherFile ?? undefined,
        res,
      ),
    ).toThrow(NotFoundException);
    expect(sendFile).not.toHaveBeenCalled();
  });

  it('serves a protected category with a valid signature for that tenant', () => {
    const { res, sendFile } = makeRes();
    const url = storage.getSignedUrl('health', 'doc.pdf', 'tenant-a');
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    controller.download('health', 'doc.pdf', sig ?? undefined, res);
    expect(sendFile).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown category', () => {
    const { res } = makeRes();
    expect(() =>
      controller.download('not-a-real-category', 'x.png', undefined, res),
    ).toThrow(NotFoundException);
  });

  it('rejects a filename with path traversal characters', () => {
    const { res } = makeRes();
    expect(() =>
      controller.download('tenants', '..%2F..%2Fetc%2Fpasswd', undefined, res),
    ).toThrow(NotFoundException);
    expect(() =>
      controller.download('tenants', '../../etc/passwd', undefined, res),
    ).toThrow(NotFoundException);
  });

  it('returns 404 when the signature is valid but the file is missing on disk', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    const { res } = makeRes();

    expect(() =>
      controller.download('tenants', 'logo.png', undefined, res),
    ).toThrow(NotFoundException);
  });
});

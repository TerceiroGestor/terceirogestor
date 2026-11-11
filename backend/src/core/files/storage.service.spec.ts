import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { StorageService } from './storage.service';
import { UPLOAD_CATEGORY_DIRS } from './upload-paths';

jest.mock('fs', () => ({
  ...jest.requireActual<Record<string, unknown>>('fs'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as {
  writeFileSync: jest.Mock;
  mkdirSync: jest.Mock;
  rmSync: jest.Mock;
};

function makeService(configValues: Record<string, string> = {}) {
  const values: Record<string, string> = {
    JWT_SECRET: 'test-secret',
    ...configValues,
  };
  return new StorageService({
    get: (key: string) => values[key],
  } as unknown as ConfigService);
}

describe('StorageService', () => {
  it('signs a URL and verifies it for the same tenant/category/filename', () => {
    const service = makeService();
    const url = service.getSignedUrl('health', 'doc.pdf', 'tenant-a', 'user-a');
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(url.startsWith('/uploads/health/tenant-a/doc.pdf?sig=')).toBe(
      true,
    );
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
    const issuer = makeService({ JWT_SECRET: 'secret-1' });
    const verifier = makeService({ JWT_SECRET: 'secret-2' });
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

  describe('put/delete (driver local)', () => {
    beforeEach(() => {
      fs.writeFileSync.mockReset();
      fs.mkdirSync.mockReset();
      fs.rmSync.mockReset();
    });

    it('put() grava no diretório da categoria+tenant (driver local, padrão)', async () => {
      const service = makeService();
      const data = Buffer.from('conteudo');

      await service.put('people', 'tenant-a', 'arquivo.pdf', data);

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        join(UPLOAD_CATEGORY_DIRS.people, 'tenant-a'),
        expect.objectContaining({ recursive: true }),
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        join(UPLOAD_CATEGORY_DIRS.people, 'tenant-a', 'arquivo.pdf'),
        data,
      );
    });

    it('delete() remove o arquivo do diretório da categoria+tenant', async () => {
      const service = makeService();

      await service.delete('avatars', 'tenant-a', 'foto.png');

      expect(fs.rmSync).toHaveBeenCalledWith(
        join(UPLOAD_CATEGORY_DIRS.avatars, 'tenant-a', 'foto.png'),
        expect.objectContaining({ force: true }),
      );
    });

    it('rejeita uma categoria desconhecida', async () => {
      const service = makeService();

      await expect(
        service.put(
          'categoria-que-nao-existe',
          'tenant-a',
          'x.txt',
          Buffer.from('a'),
        ),
      ).rejects.toThrow(/Categoria de upload desconhecida/);
    });

    it('rejeita STORAGE_DRIVER diferente de "local" (R2 ainda não existe — Parte 4.2)', async () => {
      const service = makeService({ STORAGE_DRIVER: 'r2' });

      await expect(
        service.put('people', 'tenant-a', 'x.txt', Buffer.from('a')),
      ).rejects.toThrow(/não foi implementado/);
    });
  });
});

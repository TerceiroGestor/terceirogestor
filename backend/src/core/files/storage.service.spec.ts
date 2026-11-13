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

type MockCommand = { input: Record<string, unknown> };

const s3Send = jest.fn();

function lastCommandInput(): Record<string, unknown> {
  const calls = s3Send.mock.calls as unknown as MockCommand[][];
  return calls[calls.length - 1][0].input;
}

function makeCommandMock() {
  return jest
    .fn()
    .mockImplementation((input: Record<string, unknown>) => ({ input }));
}

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: s3Send })),
  PutObjectCommand: makeCommandMock(),
  DeleteObjectCommand: makeCommandMock(),
  GetObjectCommand: makeCommandMock(),
}));

const presign = jest.fn();

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]): unknown => presign(...args),
}));

function lastPresignInput(): Record<string, unknown> {
  const calls = presign.mock.calls as unknown as [unknown, MockCommand][];
  return calls[calls.length - 1][1].input;
}

function makeService(configValues: Record<string, string> = {}) {
  const values: Record<string, string> = {
    JWT_SECRET: 'test-secret',
    ...configValues,
  };
  return new StorageService({
    get: (key: string) => values[key],
  } as unknown as ConfigService);
}

function makeR2Service(overrides: Record<string, string> = {}) {
  return makeService({
    STORAGE_DRIVER: 'r2',
    R2_ACCOUNT_ID: 'acc-123',
    R2_ACCESS_KEY_ID: 'key-id',
    R2_SECRET_ACCESS_KEY: 'key-secret',
    R2_BUCKET: 'tg-dev-arquivos',
    ...overrides,
  });
}

describe('StorageService', () => {
  beforeEach(() => {
    s3Send.mockReset();
    presign.mockReset();
  });

  it('signs a URL and verifies it for the same tenant/category/filename', async () => {
    const service = makeService();
    const url = await service.getSignedUrl(
      'health',
      'doc.pdf',
      'tenant-a',
      'user-a',
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(url.startsWith('/uploads/health/tenant-a/doc.pdf?sig=')).toBe(true);
    expect(
      service.verifySignature('health', 'doc.pdf', sig ?? undefined),
    ).toEqual({
      tenantId: 'tenant-a',
      userId: 'user-a',
    });
  });

  it('rejects a signature issued for a different tenant file that gets reused on another category/filename', async () => {
    const service = makeService();
    const url = await service.getSignedUrl(
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

  it('rejects a tampered signature', async () => {
    const service = makeService();
    const url = await service.getSignedUrl(
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

  it('rejects a signature minted with a different secret', async () => {
    const issuer = makeService({ JWT_SECRET: 'secret-1' });
    const verifier = makeService({ JWT_SECRET: 'secret-2' });
    const url = await issuer.getSignedUrl(
      'people',
      'file.jpg',
      'tenant-a',
      'user-a',
    );
    const sig = new URL(url, 'http://local').searchParams.get('sig');

    expect(
      verifier.verifySignature('people', 'file.jpg', sig ?? undefined),
    ).toBeNull();
  });

  it('rejects an expired signature', async () => {
    const service = makeService();
    const url = await service.getSignedUrl(
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
  });

  describe('put/delete/getSignedUrl (driver r2)', () => {
    it('put() envia um PutObjectCommand com a key categoria/tenant/arquivo', async () => {
      const service = makeR2Service();
      const data = Buffer.from('conteudo');

      await service.put('people', 'tenant-a', 'arquivo.pdf', data);

      expect(s3Send).toHaveBeenCalledTimes(1);
      expect(lastCommandInput()).toEqual({
        Bucket: 'tg-dev-arquivos',
        Key: 'people/tenant-a/arquivo.pdf',
        Body: data,
      });
    });

    it('delete() envia um DeleteObjectCommand com a mesma key', async () => {
      const service = makeR2Service();

      await service.delete('avatars', 'tenant-a', 'foto.png');

      expect(lastCommandInput()).toEqual({
        Bucket: 'tg-dev-arquivos',
        Key: 'avatars/tenant-a/foto.png',
      });
    });

    it('getSignedUrl() presigna um GetObjectCommand e devolve a URL do presigner', async () => {
      presign.mockResolvedValue(
        'https://tg-dev-arquivos.acc-123.r2.cloudflarestorage.com/signed',
      );
      const service = makeR2Service();

      const url = await service.getSignedUrl(
        'health',
        'doc.pdf',
        'tenant-a',
        'user-a',
        { ttlSeconds: 300 },
      );

      expect(url).toBe(
        'https://tg-dev-arquivos.acc-123.r2.cloudflarestorage.com/signed',
      );
      expect(lastPresignInput()).toEqual({
        Bucket: 'tg-dev-arquivos',
        Key: 'health/tenant-a/doc.pdf',
      });
      expect(presign).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        {
          expiresIn: 300,
        },
      );
    });

    it('rejeita quando falta alguma variável de ambiente do R2', async () => {
      const service = makeR2Service({ R2_BUCKET: '' });

      await expect(
        service.put('people', 'tenant-a', 'x.txt', Buffer.from('a')),
      ).rejects.toThrow(
        /R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET/,
      );
    });
  });

  it('rejeita um STORAGE_DRIVER desconhecido', async () => {
    const service = makeService({ STORAGE_DRIVER: 'azure' });

    await expect(
      service.put('people', 'tenant-a', 'x.txt', Buffer.from('a')),
    ).rejects.toThrow(/não é suportado/);
  });
});

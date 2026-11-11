import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { StorageService } from './storage.service';

type UploadMethod =
  | 'uploadAvatar'
  | 'uploadHealthDocument'
  | 'uploadTenantLogo'
  | 'uploadActionPhoto'
  | 'uploadPeopleAttachment'
  | 'uploadPantryAttachment'
  | 'uploadDepositAttachment'
  | 'uploadProgramAttachment'
  | 'uploadProjectAttachment'
  | 'uploadActionAttachment'
  | 'uploadTaskAttachment';

const PDF_BYTES = Buffer.from('%PDF-1.4\nconteudo');
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'arquivo.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: PDF_BYTES,
    size: PDF_BYTES.length,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('FilesController', () => {
  let controller: FilesController;
  let storage: { put: jest.Mock<Promise<void>, [string, string, Buffer]> };

  beforeEach(async () => {
    storage = {
      put: jest
        .fn<Promise<void>, [string, string, Buffer]>()
        .mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: StorageService,
          useValue: storage as unknown as StorageService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('rejeita quando nenhum arquivo é enviado', async () => {
    await expect(controller.uploadAvatar(undefined)).rejects.toThrow(
      BadRequestException,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  const jpegFile: Partial<Express.Multer.File> = {
    originalname: 'foto.jpg',
    mimetype: 'image/jpeg',
    buffer: JPEG_BYTES,
    size: JPEG_BYTES.length,
  };

  const cases: Array<{
    method: UploadMethod;
    category: string;
    pathPrefix: string;
    extraFields: boolean;
    fileOverrides?: Partial<Express.Multer.File>;
  }> = [
    {
      method: 'uploadAvatar',
      category: 'avatars',
      pathPrefix: '/uploads/avatars/',
      extraFields: false,
      fileOverrides: jpegFile,
    },
    {
      method: 'uploadHealthDocument',
      category: 'health',
      pathPrefix: '/uploads/health/',
      extraFields: false,
    },
    {
      method: 'uploadTenantLogo',
      category: 'tenants',
      pathPrefix: '/uploads/tenants/',
      extraFields: false,
      fileOverrides: jpegFile,
    },
    {
      method: 'uploadActionPhoto',
      category: 'actions',
      pathPrefix: '/uploads/actions/',
      extraFields: false,
      fileOverrides: jpegFile,
    },
    {
      method: 'uploadPeopleAttachment',
      category: 'people',
      pathPrefix: '/uploads/people/',
      extraFields: true,
    },
    {
      method: 'uploadPantryAttachment',
      category: 'pantry',
      pathPrefix: '/uploads/pantry/',
      extraFields: true,
    },
    {
      method: 'uploadDepositAttachment',
      category: 'deposit',
      pathPrefix: '/uploads/deposit/',
      extraFields: true,
    },
    {
      method: 'uploadProgramAttachment',
      category: 'programs',
      pathPrefix: '/uploads/programs/',
      extraFields: true,
    },
    {
      method: 'uploadProjectAttachment',
      category: 'projects',
      pathPrefix: '/uploads/projects/',
      extraFields: true,
    },
    {
      method: 'uploadActionAttachment',
      category: 'action-attachments',
      pathPrefix: '/uploads/action-attachments/',
      extraFields: true,
    },
    {
      method: 'uploadTaskAttachment',
      category: 'tasks',
      pathPrefix: '/uploads/tasks/',
      extraFields: true,
    },
  ];

  it.each(cases)(
    '$method grava via StorageService na categoria "$category" e devolve o path',
    async ({ method, category, pathPrefix, extraFields, fileOverrides }) => {
      const file = makeFile(fileOverrides);

      const result: Record<string, unknown> = await controller[method](file);

      expect(storage.put).toHaveBeenCalledTimes(1);
      const [calledCategory, calledFilename, calledBuffer] =
        storage.put.mock.calls[0];
      expect(calledCategory).toBe(category);
      expect(calledBuffer).toBe(file.buffer);
      expect(result.path).toBe(`${pathPrefix}${calledFilename}`);

      if (extraFields) {
        expect(result.mimeType).toBe(file.mimetype);
        expect(result.size).toBe(file.size);
        expect(result.originalName).toBe(file.originalname);
      }
    },
  );

  it('rejeita quando nenhum arquivo é enviado para um endpoint de anexo', async () => {
    await expect(controller.uploadPeopleAttachment(undefined)).rejects.toThrow(
      BadRequestException,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejeita um arquivo cujo conteudo real nao corresponde a extensao declarada', async () => {
    // Nome e mimetype dizem JPEG, mas o conteudo real e um PDF.
    const file = makeFile({
      originalname: 'foto.jpg',
      mimetype: 'image/jpeg',
      buffer: PDF_BYTES,
      size: PDF_BYTES.length,
    });

    await expect(controller.uploadAvatar(file)).rejects.toThrow(
      BadRequestException,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejeita uma extensao fora do permitido mesmo com assinatura valida', async () => {
    // .exe nao esta na allowlist de avatar, mesmo que o filtro de bytes
    // nao tenha nenhuma assinatura conhecida para checar.
    const file = makeFile({
      originalname: 'malicioso.exe',
      mimetype: 'image/jpeg',
      buffer: JPEG_BYTES,
      size: JPEG_BYTES.length,
    });

    await expect(controller.uploadAvatar(file)).rejects.toThrow(
      BadRequestException,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('aceita .txt/.csv por nao terem assinatura binaria confiavel', async () => {
    const file = makeFile({
      originalname: 'notas.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('qualquer conteudo de texto'),
    });

    const result: Record<string, unknown> =
      await controller.uploadPeopleAttachment(file);

    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(result.path).toContain('/uploads/people/');
  });
});

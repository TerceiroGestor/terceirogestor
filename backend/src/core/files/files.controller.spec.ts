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

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'arquivo.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('conteudo'),
    size: 8,
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

  const cases: Array<{
    method: UploadMethod;
    category: string;
    pathPrefix: string;
    extraFields: boolean;
  }> = [
    {
      method: 'uploadAvatar',
      category: 'avatars',
      pathPrefix: '/uploads/avatars/',
      extraFields: false,
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
    },
    {
      method: 'uploadActionPhoto',
      category: 'actions',
      pathPrefix: '/uploads/actions/',
      extraFields: false,
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
    async ({ method, category, pathPrefix, extraFields }) => {
      const file = makeFile();

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
});

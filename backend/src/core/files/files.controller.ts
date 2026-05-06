import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { CloudStorageService } from './cloud-storage.service';

const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_HEALTH_FILE_SIZE = 6 * 1024 * 1024;
const MAX_TENANT_LOGO_SIZE = 3 * 1024 * 1024;
const MAX_ACTION_PHOTO_FILE_SIZE = 6 * 1024 * 1024;
const MAX_PEOPLE_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PANTRY_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DEPOSIT_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PROGRAM_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PROJECT_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ACTION_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TASK_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_AVATAR_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);
const ALLOWED_HEALTH_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
]);
const ALLOWED_TENANT_LOGO_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);
const ALLOWED_ACTION_PHOTO_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]);
const ALLOWED_PEOPLE_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
]);
const ALLOWED_PANTRY_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
]);
const ALLOWED_DEPOSIT_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
]);
const ALLOWED_PROGRAM_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
]);
const ALLOWED_ACTION_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
]);
const ALLOWED_PROJECT_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
]);
const ALLOWED_TASK_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
]);

@Controller('files')
export class FilesController {
  constructor(private readonly cloudStorage: CloudStorageService) {}

  private async uploadToPublicBucket(
    file: Express.Multer.File,
    folder: string,
    allowedExtensions: Set<string>,
  ) {
    const ext = extname(file.originalname).toLowerCase();
    const safeExt = allowedExtensions.has(ext) ? ext : '';
    const filename = `${randomUUID()}${safeExt}`;
    const objectPath = `uploads/${folder}/${filename}`;

    const uploaded = await this.cloudStorage.uploadPublicObject({
      objectPath,
      data: file.buffer,
      contentType: file.mimetype || undefined,
    });

    return {
      path: uploaded.publicUrl,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }

  @Post('avatars')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'avatars',
      ALLOWED_AVATAR_EXTENSIONS,
    ).then((uploaded) => ({ path: uploaded.path }));
  }

  @Post('health-documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_HEALTH_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (
          !file.mimetype.startsWith('image/') &&
          file.mimetype !== 'application/pdf'
        ) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadHealthDocument(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    const uploaded = await this.uploadToPublicBucket(
      file,
      'health',
      ALLOWED_HEALTH_EXTENSIONS,
    );
    return { path: uploaded.path };
  }

  @Post('tenant-logos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_TENANT_LOGO_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadTenantLogo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    const uploaded = await this.uploadToPublicBucket(
      file,
      'tenants',
      ALLOWED_TENANT_LOGO_EXTENSIONS,
    );
    return { path: uploaded.path };
  }

  @Post('action-photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ACTION_PHOTO_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadActionPhoto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    const uploaded = await this.uploadToPublicBucket(
      file,
      'actions',
      ALLOWED_ACTION_PHOTO_EXTENSIONS,
    );
    return { path: uploaded.path };
  }

  @Post('people-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PEOPLE_ATTACHMENT_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_PEOPLE_ATTACHMENT_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadPeopleAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'people',
      ALLOWED_PEOPLE_ATTACHMENT_EXTENSIONS,
    );
  }

  @Post('pantry-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PANTRY_ATTACHMENT_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_PANTRY_ATTACHMENT_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadPantryAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'pantry',
      ALLOWED_PANTRY_ATTACHMENT_EXTENSIONS,
    );
  }

  @Post('deposit-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DEPOSIT_ATTACHMENT_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_DEPOSIT_ATTACHMENT_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadDepositAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'deposit',
      ALLOWED_DEPOSIT_ATTACHMENT_EXTENSIONS,
    );
  }

  @Post('program-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROGRAM_ATTACHMENT_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_PROGRAM_ATTACHMENT_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadProgramAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'programs',
      ALLOWED_PROGRAM_ATTACHMENT_EXTENSIONS,
    );
  }

  @Post('project-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROJECT_ATTACHMENT_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_PROJECT_ATTACHMENT_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadProjectAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'projects',
      ALLOWED_PROJECT_ATTACHMENT_EXTENSIONS,
    );
  }

  @Post('action-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ACTION_ATTACHMENT_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_ACTION_ATTACHMENT_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadActionAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'action-attachments',
      ALLOWED_ACTION_ATTACHMENT_EXTENSIONS,
    );
  }

  @Post('task-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_TASK_ATTACHMENT_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_TASK_ATTACHMENT_EXTENSIONS.has(ext)) {
          cb(new BadRequestException('Formato de arquivo invalido.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadTaskAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return this.uploadToPublicBucket(
      file,
      'tasks',
      ALLOWED_TASK_ATTACHMENT_EXTENSIONS,
    );
  }
}

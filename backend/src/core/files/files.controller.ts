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
import { StorageService } from './storage.service';

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
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
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

function buildFilename(originalname: string, allowedExtensions: Set<string>) {
  const ext = extname(originalname).toLowerCase();
  const safeExt = allowedExtensions.has(ext) ? ext : '';
  return `${randomUUID()}${safeExt}`;
}

function imageOnlyFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Formato de arquivo invalido.'), false);
    return;
  }
  cb(null, true);
}

function extensionAllowlistFilter(allowedExtensions: Set<string>) {
  return (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      cb(new BadRequestException('Formato de arquivo invalido.'), false);
      return;
    }
    cb(null, true);
  };
}

@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Post('avatars')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_FILE_SIZE },
      fileFilter: imageOnlyFilter,
    }),
  )
  async uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_AVATAR_EXTENSIONS,
    );
    await this.storage.put('avatars', filename, file.buffer);

    return {
      path: `/uploads/avatars/${filename}`,
    };
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
    const filename = buildFilename(
      file.originalname,
      ALLOWED_HEALTH_EXTENSIONS,
    );
    await this.storage.put('health', filename, file.buffer);

    return {
      path: `/uploads/health/${filename}`,
    };
  }

  @Post('tenant-logos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_TENANT_LOGO_SIZE },
      fileFilter: imageOnlyFilter,
    }),
  )
  async uploadTenantLogo(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_TENANT_LOGO_EXTENSIONS,
    );
    await this.storage.put('tenants', filename, file.buffer);

    return {
      path: `/uploads/tenants/${filename}`,
    };
  }

  @Post('action-photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ACTION_PHOTO_FILE_SIZE },
      fileFilter: imageOnlyFilter,
    }),
  )
  async uploadActionPhoto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ACTION_PHOTO_EXTENSIONS,
    );
    await this.storage.put('actions', filename, file.buffer);

    return {
      path: `/uploads/actions/${filename}`,
    };
  }

  @Post('people-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PEOPLE_ATTACHMENT_FILE_SIZE },
      fileFilter: extensionAllowlistFilter(ALLOWED_ATTACHMENT_EXTENSIONS),
    }),
  )
  async uploadPeopleAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ATTACHMENT_EXTENSIONS,
    );
    await this.storage.put('people', filename, file.buffer);

    return {
      path: `/uploads/people/${filename}`,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }

  @Post('pantry-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PANTRY_ATTACHMENT_FILE_SIZE },
      fileFilter: extensionAllowlistFilter(ALLOWED_ATTACHMENT_EXTENSIONS),
    }),
  )
  async uploadPantryAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ATTACHMENT_EXTENSIONS,
    );
    await this.storage.put('pantry', filename, file.buffer);

    return {
      path: `/uploads/pantry/${filename}`,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }

  @Post('deposit-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DEPOSIT_ATTACHMENT_FILE_SIZE },
      fileFilter: extensionAllowlistFilter(ALLOWED_ATTACHMENT_EXTENSIONS),
    }),
  )
  async uploadDepositAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ATTACHMENT_EXTENSIONS,
    );
    await this.storage.put('deposit', filename, file.buffer);

    return {
      path: `/uploads/deposit/${filename}`,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }

  @Post('program-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROGRAM_ATTACHMENT_FILE_SIZE },
      fileFilter: extensionAllowlistFilter(ALLOWED_ATTACHMENT_EXTENSIONS),
    }),
  )
  async uploadProgramAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ATTACHMENT_EXTENSIONS,
    );
    await this.storage.put('programs', filename, file.buffer);

    return {
      path: `/uploads/programs/${filename}`,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }

  @Post('project-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROJECT_ATTACHMENT_FILE_SIZE },
      fileFilter: extensionAllowlistFilter(ALLOWED_ATTACHMENT_EXTENSIONS),
    }),
  )
  async uploadProjectAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ATTACHMENT_EXTENSIONS,
    );
    await this.storage.put('projects', filename, file.buffer);

    return {
      path: `/uploads/projects/${filename}`,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }

  @Post('action-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ACTION_ATTACHMENT_FILE_SIZE },
      fileFilter: extensionAllowlistFilter(ALLOWED_ATTACHMENT_EXTENSIONS),
    }),
  )
  async uploadActionAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ATTACHMENT_EXTENSIONS,
    );
    await this.storage.put('action-attachments', filename, file.buffer);

    return {
      path: `/uploads/action-attachments/${filename}`,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }

  @Post('task-attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_TASK_ATTACHMENT_FILE_SIZE },
      fileFilter: extensionAllowlistFilter(ALLOWED_ATTACHMENT_EXTENSIONS),
    }),
  )
  async uploadTaskAttachment(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }
    const filename = buildFilename(
      file.originalname,
      ALLOWED_ATTACHMENT_EXTENSIONS,
    );
    await this.storage.put('tasks', filename, file.buffer);

    return {
      path: `/uploads/tasks/${filename}`,
      mimeType: file.mimetype || null,
      size: file.size ?? null,
      originalName: file.originalname || filename,
    };
  }
}

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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';

const AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');
const HEALTH_DOC_DIR = join(process.cwd(), 'uploads', 'health');
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_HEALTH_FILE_SIZE = 6 * 1024 * 1024;
const ALLOWED_AVATAR_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_HEALTH_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
]);

function ensureAvatarDir() {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

function ensureHealthDocDir() {
  fs.mkdirSync(HEALTH_DOC_DIR, { recursive: true });
}

@Controller('files')
export class FilesController {
  @Post('avatars')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureAvatarDir();
          cb(null, AVATAR_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const safeExt = ALLOWED_AVATAR_EXTENSIONS.has(ext) ? ext : '';
          const filename = `${randomUUID()}${safeExt}`;
          cb(null, filename);
        },
      }),
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

    return {
      path: `/uploads/avatars/${file.filename}`,
    };
  }

  @Post('health-documents')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureHealthDocDir();
          cb(null, HEALTH_DOC_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const safeExt = ALLOWED_HEALTH_EXTENSIONS.has(ext) ? ext : '';
          const filename = `${randomUUID()}${safeExt}`;
          cb(null, filename);
        },
      }),
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
  uploadHealthDocument(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio.');
    }

    return {
      path: `/uploads/health/${file.filename}`,
    };
  }
}

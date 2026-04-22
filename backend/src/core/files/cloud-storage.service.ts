import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

type UploadPublicObjectArgs = {
  objectPath: string;
  data: Buffer;
  contentType?: string | null;
};

@Injectable()
export class CloudStorageService {
  private readonly logger = new Logger(CloudStorageService.name);
  private readonly storage = new Storage();

  private readonly publicBucketName =
    process.env.GCS_PUBLIC_BUCKET_NAME?.trim() ?? '';

  private readonly publicBaseUrl = this.resolvePublicBaseUrl();

  async uploadPublicObject(args: UploadPublicObjectArgs) {
    const bucketName = this.publicBucketName;
    if (!bucketName) {
      throw new InternalServerErrorException(
        'Bucket publico nao configurado (GCS_PUBLIC_BUCKET_NAME).',
      );
    }

    const objectPath = this.normalizeObjectPath(args.objectPath);
    const file = this.storage.bucket(bucketName).file(objectPath);

    await file.save(args.data, {
      resumable: false,
      contentType: args.contentType ?? undefined,
      validation: 'crc32c',
    });

    this.logger.log(`Upload concluido no GCS: gs://${bucketName}/${objectPath}`);

    return {
      objectPath,
      publicUrl: `${this.publicBaseUrl}/${this.encodeObjectPath(objectPath)}`,
    };
  }

  private resolvePublicBaseUrl() {
    const configured = process.env.GCS_PUBLIC_BASE_URL?.trim() ?? '';
    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    const bucketName = this.publicBucketName;
    if (!bucketName) {
      return 'https://storage.googleapis.com';
    }

    return `https://storage.googleapis.com/${bucketName}`;
  }

  private normalizeObjectPath(path: string) {
    return path.replace(/^\/+/, '');
  }

  private encodeObjectPath(path: string) {
    return path
      .split('/')
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }
}

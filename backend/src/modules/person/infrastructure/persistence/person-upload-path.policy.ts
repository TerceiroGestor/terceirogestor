import { isUploadPathAllowed } from '../../../../core/files/upload-path.utils';
import { PERSON_UPLOAD_PATH_PREFIXES } from '../../domain/constants/person.constants';

export const isPersonUploadPathAllowed = (filePath: string) =>
  PERSON_UPLOAD_PATH_PREFIXES.some((pathPrefix) =>
    isUploadPathAllowed(filePath, pathPrefix),
  );
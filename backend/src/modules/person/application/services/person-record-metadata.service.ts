import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeString } from '../../../../core/utils/strings';
import {
  mapPersonAttachmentItem,
  mapPersonCommentItem,
} from '../mappers/person-response.mapper';
import {
  PERSON_RECORD_TYPES,
  type PersonRecordType,
} from '../../domain/constants/person.constants';
import { isPersonUploadPathAllowed } from '../../infrastructure/persistence/person-upload-path.policy';
import { PersonRecordMetadataRepository } from '../../infrastructure/repositories/person-record-metadata.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';
import { GetPersonByIdUseCase } from '../use-cases/get-person-by-id.use-case';
import { CreatePersonAttachmentDto } from '../../dto/create-person-attachment.dto';
import { CreatePersonCommentDto } from '../../dto/create-person-comment.dto';
import { CreatePersonRecordAttachmentDto } from '../../dto/create-person-record-attachment.dto';
import { CreatePersonRecordCommentDto } from '../../dto/create-person-record-comment.dto';

@Injectable()
export class PersonRecordMetadataService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personRecordMetadataRepository: PersonRecordMetadataRepository,
    private readonly getPersonByIdUseCase: GetPersonByIdUseCase,
  ) {}

  /** Busca comentário simples por id */
  private async findComment(tenantId: string, personId: string, commentId: string) {
    return this.personRecordMetadataRepository.findComment(tenantId, personId, commentId);
  }

  /** Busca anexo simples por id */
  private async findAttachment(tenantId: string, personId: string, attachmentId: string) {
    return this.personRecordMetadataRepository.findAttachment(tenantId, personId, attachmentId);
  }

  /** Busca comentário de registro por id */
  private async findRecordComment(
    tenantId: string,
    personId: string,
    recordType: PersonRecordType,
    recordId: string,
    commentId: string,
  ) {
    return this.personRecordMetadataRepository.findRecordComment(
      tenantId,
      personId,
      recordType,
      recordId,
      commentId,
    );
  }

  /** Busca anexo de registro por id */

  // ...existing code...
// Fim da classe permanece inalterado

  async addComment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    dto: CreatePersonCommentDto,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Informe um comentario.');
    }

    const mentionUserIds = await this.resolveMentionUserIds(
      tenantId,
      dto.mentionUserIds,
    );

    await this.personRecordMetadataRepository.createComment({
      tenantId,
      personId,
      authorUserId: actorUserId,
      body,
      mentionUserIds,
    });

    return this.getPersonByIdUseCase.execute(tenantId, personId);
  }

  async deleteComment(tenantId: string, personId: string, commentId: string) {
    await this.assertPersonExists(tenantId, personId);
    const comment = await this.personRecordMetadataRepository.findComment(
      tenantId,
      personId,
      commentId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.personRecordMetadataRepository.deleteComment(comment.id);
    return this.getPersonByIdUseCase.execute(tenantId, personId);
  }

  async addAttachment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    dto: CreatePersonAttachmentDto,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const label = dto.label.trim();
    const filePath = dto.filePath.trim();

    if (!label) {
      throw new BadRequestException('Informe um nome para o anexo.');
    }

    if (!isPersonUploadPathAllowed(filePath)) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    await this.personRecordMetadataRepository.createAttachment({
      tenantId,
      personId,
      uploadedByUserId: actorUserId,
      label,
      filePath,
      mimeType: normalizeString(dto.mimeType),
      fileSizeBytes: dto.fileSizeBytes ?? null,
    });

    return this.getPersonByIdUseCase.execute(tenantId, personId);
  }

  async deleteAttachment(
    tenantId: string,
    personId: string,
    attachmentId: string,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const attachment = await this.personRecordMetadataRepository.findAttachment(
      tenantId,
      personId,
      attachmentId,
    );

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.personRecordMetadataRepository.deleteAttachment(attachment.id);
    return this.getPersonByIdUseCase.execute(tenantId, personId);
  }

  async getRecordMetadata(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
  ) {
    const recordType = await this.assertRecordBelongsToPerson(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
    );

    const [comments, attachments, tags] =
      await this.personRecordMetadataRepository.listRecordMetadata(
        tenantId,
        personId,
        recordType,
        recordId,
      );

    return {
      comments: comments.map(mapPersonCommentItem),
      attachments: attachments.map(mapPersonAttachmentItem),
      tags: tags.map((tag) => tag.value),
    };
  }

  async addRecordComment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    dto: CreatePersonRecordCommentDto,
  ) {
    const recordType = await this.assertRecordBelongsToPerson(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
    );
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('Informe um comentario.');
    }

    const mentionUserIds = await this.resolveMentionUserIds(
      tenantId,
      dto.mentionUserIds,
    );

    await this.personRecordMetadataRepository.createRecordComment({
      tenantId,
      personId,
      recordType,
      recordId,
      authorUserId: actorUserId,
      body,
      mentionUserIds,
    });

    return this.getRecordMetadata(tenantId, personId, recordType, recordId);
  }

  async deleteRecordComment(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    commentId: string,
  ) {
    const recordType = await this.assertRecordBelongsToPerson(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
    );
    const comment = await this.personRecordMetadataRepository.findRecordComment(
      tenantId,
      personId,
      recordType,
      recordId,
      commentId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.personRecordMetadataRepository.deleteRecordComment(comment.id);
    return this.getRecordMetadata(tenantId, personId, recordType, recordId);
  }

  async addRecordAttachment(
    tenantId: string,
    actorUserId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    dto: CreatePersonRecordAttachmentDto,
  ) {
    const recordType = await this.assertRecordBelongsToPerson(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
    );
    const label = dto.label.trim();
    const filePath = dto.filePath.trim();

    if (!label) {
      throw new BadRequestException('Informe um nome para o anexo.');
    }

    if (!isPersonUploadPathAllowed(filePath)) {
      throw new BadRequestException('Caminho de anexo invalido.');
    }

    await this.personRecordMetadataRepository.createRecordAttachment({
      tenantId,
      personId,
      recordType,
      recordId,
      uploadedByUserId: actorUserId,
      label,
      filePath,
      mimeType: normalizeString(dto.mimeType),
      fileSizeBytes: dto.fileSizeBytes ?? null,
    });

    return this.getRecordMetadata(tenantId, personId, recordType, recordId);
  }

  async deleteRecordAttachment(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    attachmentId: string,
  ) {
    const recordType = await this.assertRecordBelongsToPerson(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
    );
    const attachment =
      await this.personRecordMetadataRepository.findRecordAttachment(
        tenantId,
        personId,
        recordType,
        recordId,
        attachmentId,
      );

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.personRecordMetadataRepository.deleteRecordAttachment(
      attachment.id,
    );
    return this.getRecordMetadata(tenantId, personId, recordType, recordId);
  }

  async setRecordTags(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
    tags: string[],
  ) {
    const recordType = await this.assertRecordBelongsToPerson(
      tenantId,
      personId,
      recordTypeRaw,
      recordId,
    );
    const normalizedTags = Array.from(
      new Set(
        (tags ?? [])
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 30),
      ),
    );

    await this.personRecordMetadataRepository.replaceRecordTags({
      tenantId,
      personId,
      recordType,
      recordId,
      values: normalizedTags,
    });

    return this.getRecordMetadata(tenantId, personId, recordType, recordId);
  }

  private async assertPersonExists(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
  }

  private normalizeRecordType(recordType: string): PersonRecordType {
    const normalized = recordType.trim().toLowerCase() as PersonRecordType;
    if (!PERSON_RECORD_TYPES.includes(normalized)) {
      throw new BadRequestException('Tipo de registro invalido.');
    }
    return normalized;
  }

  private async assertRecordBelongsToPerson(
    tenantId: string,
    personId: string,
    recordTypeRaw: string,
    recordId: string,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const recordType = this.normalizeRecordType(recordTypeRaw);
    const record = await this.personRecordMetadataRepository.findRecordByType(
      tenantId,
      personId,
      recordType,
      recordId,
    );

    if (!record) {
      throw new NotFoundException('Registro nao encontrado.');
    }

    return recordType;
  }

  private async resolveMentionUserIds(
    tenantId: string,
    mentionUserIds?: string[] | null,
  ) {
    const normalized = Array.from(
      new Set(
        (mentionUserIds ?? []).map((entry) => entry.trim()).filter(Boolean),
      ),
    );

    if (!normalized.length) {
      return [];
    }

    const users = await this.personRecordMetadataRepository.findExistingUserIds(
      tenantId,
      normalized,
    );

    return users.map((user) => user.id);
  }
}
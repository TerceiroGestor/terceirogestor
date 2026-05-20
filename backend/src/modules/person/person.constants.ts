/**
 * @deprecated Shim de compatibilidade para imports legados na raiz do modulo.
 * Remover quando DTOs e consumidores internos passarem a importar diretamente das camadas canonicas.
 */
export {
  GENDER_OPTIONS,
  PERSON_TYPE_OPTIONS,
  PERSON_RECORD_TYPES,
  RACE_COLOR_OPTIONS,
  SEX_OPTIONS,
  STATUS_OPTIONS,
} from './domain/constants/person.constants';

export {
  PERSON_DETAIL_INCLUDE,
  PERSON_RECORD_ATTACHMENT_INCLUDE,
  PERSON_RECORD_COMMENT_INCLUDE,
} from './infrastructure/persistence/person-prisma.constants';

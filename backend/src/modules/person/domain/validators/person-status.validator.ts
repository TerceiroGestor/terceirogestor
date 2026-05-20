import { DomainValidationError } from '../../../../core/errors/domain.error';
import { normalizeString } from '../../../../core/utils/strings';
import { normalizeStatus } from '../normalizers/person-field.normalizer';

export const assertDepartureReasonForStatus = (
  status?: string | null,
  departureReason?: string | null,
) => {
  if (
    normalizeStatus(status) === 'Desligado' &&
    !normalizeString(departureReason)
  ) {
    throw new DomainValidationError('Informe o motivo do desligamento.');
  }
};
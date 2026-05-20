import { DomainValidationError } from '../../../../core/errors/domain.error';

export const assertPersonContactName = (
  role: 'SELF' | 'RESPONSIBLE' | 'EMERGENCY',
  name: string | null | undefined,
) => {
  if (role !== 'SELF' && !name) {
    throw new DomainValidationError('Informe o nome do contato.');
  }
};
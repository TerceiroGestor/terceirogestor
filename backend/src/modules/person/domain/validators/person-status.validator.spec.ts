import { DomainValidationError } from '../../../../core/errors/domain.error';
import { assertDepartureReasonForStatus } from './person-status.validator';

describe('person-status.validator', () => {
  it('requires departure reason for desligado', () => {
    expect(() =>
      assertDepartureReasonForStatus('Desligado', null),
    ).toThrow(DomainValidationError);
  });

  it('accepts active status without departure reason', () => {
    expect(() =>
      assertDepartureReasonForStatus('Ativo', null),
    ).not.toThrow();
  });
});
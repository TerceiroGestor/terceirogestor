import {
  normalizeStatus,
  normalizeTags,
} from './person-field.normalizer';

describe('person-field.normalizer', () => {
  it('normalizes legacy status label', () => {
    expect(normalizeStatus('Em analise')).toBe('Em espera');
  });

  it('serializes cleaned tags', () => {
    expect(normalizeTags([' alpha ', '', 'beta'])).toBe(
      JSON.stringify(['alpha', 'beta']),
    );
  });
});
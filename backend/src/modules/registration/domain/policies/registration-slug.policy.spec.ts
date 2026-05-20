import { normalizeTenantSlug } from './registration-slug.policy';

describe('normalizeTenantSlug', () => {
  it('prefixes reserved slugs', () => {
    expect(normalizeTenantSlug('people')).toBe('tenant-people');
  });

  it('keeps valid slugs unchanged', () => {
    expect(normalizeTenantSlug('instituicao-teste')).toBe('instituicao-teste');
  });
});
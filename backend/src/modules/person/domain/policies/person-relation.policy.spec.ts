import {
  isGenealogyRelation,
  requiresPersonContextForInverseType,
  resolveInverseType,
} from './person-relation.policy';

describe('person-relation.policy', () => {
  it('detects genealogy relations', () => {
    expect(isGenealogyRelation('Mãe')).toBe(true);
    expect(isGenealogyRelation('Responsável técnico')).toBe(false);
  });

  it('resolves inverse type without persistence dependency', () => {
    expect(requiresPersonContextForInverseType('Filho')).toBe(true);
    expect(
      resolveInverseType('Filho', { sex: 'Feminino', gender: 'Mulher' }),
    ).toBe('Mãe');
  });
});
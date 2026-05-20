const normalizeRelationKey = (value?: string | null) =>
  (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const GENEALOGY_RELATION_KEYS = [
  'pai',
  'mae',
  'filho',
  'filha',
  'irma',
  'conjuge',
];

export const isGenealogyRelation = (value?: string | null) => {
  if (!value) return false;

  const key = normalizeRelationKey(value);
  return GENEALOGY_RELATION_KEYS.some((prefix) => key.startsWith(prefix));
};

const resolveParentTypeFromPerson = (
  person?: { sex?: string | null; gender?: string | null } | null,
) => {
  const sexKey = normalizeRelationKey(person?.sex);
  const genderKey = normalizeRelationKey(person?.gender);

  if (sexKey.startsWith('f') || genderKey.includes('mulher')) {
    return 'Mãe';
  }
  if (sexKey.startsWith('m') || genderKey.includes('homem')) {
    return 'Pai';
  }

  return 'Responsável';
};

const resolveStepParentTypeFromPerson = (
  person?: { sex?: string | null; gender?: string | null } | null,
) => {
  const parentType = resolveParentTypeFromPerson(person);
  if (parentType === 'Mãe') return 'Madrasta';
  if (parentType === 'Pai') return 'Padrasto';
  return 'Responsável';
};

export const requiresPersonContextForInverseType = (value?: string | null) => {
  const key = normalizeRelationKey(value);
  return (
    key.startsWith('filho') ||
    key.startsWith('filha') ||
    key.startsWith('enteado') ||
    key.startsWith('enteada')
  );
};

export const resolveInverseType = (
  relationType: string,
  person?: { sex?: string | null; gender?: string | null } | null,
) => {
  const key = normalizeRelationKey(relationType);

  if (key.startsWith('pai') || key.startsWith('mae') || key === 'paimae') {
    return 'Filho(a)';
  }
  if (key.startsWith('filho') || key.startsWith('filha')) {
    return resolveParentTypeFromPerson(person);
  }
  if (key.startsWith('padrasto') || key.startsWith('madrasta')) {
    return 'Enteado(a)';
  }
  if (key.startsWith('enteado') || key.startsWith('enteada')) {
    return resolveStepParentTypeFromPerson(person);
  }
  if (key.startsWith('irmaosporafinidade')) {
    return 'Irmãos por afinidade';
  }
  if (key.startsWith('bisavo')) {
    return 'Bisneto(a)';
  }
  if (key.startsWith('bisneto') || key.startsWith('bisneta')) {
    return 'Bisavô(ó)';
  }
  if (key.startsWith('tioavo')) {
    return 'Sobrinho-neto(a)';
  }
  if (key.startsWith('sobrinhoneto') || key.startsWith('sobrinhoneta')) {
    return 'Tio-avô(ó)';
  }
  if (key.startsWith('irma')) {
    return 'Irmão(a)';
  }
  if (key.startsWith('conjuge')) {
    return 'Cônjuge';
  }
  if (key.startsWith('responsavel')) {
    return 'Dependente';
  }
  if (key.startsWith('dependente')) {
    return 'Responsável';
  }
  if (key.startsWith('tio')) {
    return 'Sobrinho(a)';
  }
  if (key.startsWith('sobrinho') || key.startsWith('sobrinha')) {
    return 'Tio(a)';
  }
  if (key.startsWith('primo') || key.startsWith('prima')) {
    return 'Primo(a)';
  }
  if (key.startsWith('avo')) {
    return 'Neto(a)';
  }
  if (key.startsWith('neto') || key.startsWith('neta')) {
    return 'Avô(a)';
  }

  return relationType;
};
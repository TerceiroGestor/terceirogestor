export const REGISTRATION_CODE_TTL_MINUTES = 10;

export const DEFAULT_PERMISSIONS = [
  { key: 'people.read', description: 'Ler pessoas' },
  { key: 'people.create', description: 'Criar pessoas' },
  { key: 'people.update', description: 'Atualizar pessoas' },
  { key: 'people.delete', description: 'Excluir pessoas' },
  { key: 'pantry.read', description: 'Ler despensa' },
  { key: 'pantry.create', description: 'Criar despensa' },
  { key: 'pantry.update', description: 'Atualizar despensa' },
  { key: 'pantry.delete', description: 'Excluir despensa' },
  { key: 'users.read', description: 'Ler usuarios' },
  { key: 'users.create', description: 'Criar usuarios' },
  { key: 'users.update', description: 'Atualizar usuarios' },
  { key: 'users.delete', description: 'Excluir usuarios' },
  { key: 'roles.manage', description: 'Gerenciar perfis e permissoes' },
  { key: 'audit.read', description: 'Ler auditoria de dados' },
  { key: 'tenants.read', description: 'Ler dados da instituicao' },
  { key: 'tenants.update', description: 'Atualizar dados da instituicao' },
] as const;

export const DEFAULT_ROLE_DEFINITIONS = [
  {
    name: 'Admin',
    description: 'Administrador da instituicao',
    permissionKeys: DEFAULT_PERMISSIONS.map((permission) => permission.key),
  },
  {
    name: 'Gestor',
    description: 'Gestao operacional',
    permissionKeys: ['people.read', 'people.create', 'people.update', 'people.delete', 'tenants.read'],
  },
  {
    name: 'Atendimento',
    description: 'Equipe de atendimento',
    permissionKeys: ['people.read', 'people.create', 'people.update'],
  },
  {
    name: 'Leitor',
    description: 'Acesso somente leitura',
    permissionKeys: ['people.read', 'pantry.read', 'tenants.read', 'audit.read'],
  },
] as const;


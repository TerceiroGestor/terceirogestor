import { mapRoleDetail } from './role-response.mapper';

describe('mapRoleDetail', () => {
  it('maps role permissions to response shape', () => {
    const result = mapRoleDetail({
      id: 'role-1',
      name: 'Admin',
      description: 'Perfil administrador',
      createdAt: new Date('2026-05-20T00:00:00.000Z'),
      updatedAt: new Date('2026-05-20T00:00:00.000Z'),
      permissions: [
        {
          permission: {
            id: 'perm-1',
            key: 'roles.manage',
            description: 'Gerenciar perfis',
          },
        },
      ],
    } as any);

    expect(result).toEqual({
      id: 'role-1',
      name: 'Admin',
      description: 'Perfil administrador',
      permissions: [
        {
          id: 'perm-1',
          key: 'roles.manage',
          description: 'Gerenciar perfis',
        },
      ],
      createdAt: new Date('2026-05-20T00:00:00.000Z'),
      updatedAt: new Date('2026-05-20T00:00:00.000Z'),
    });
  });
});
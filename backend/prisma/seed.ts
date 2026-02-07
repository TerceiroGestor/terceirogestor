import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { createPrismaAdapter } from '../src/core/prisma/prisma-adapter';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = createPrismaAdapter(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantId = '2fad98c9-5d6c-4f76-8c46-00fb80d0509b';
  const roleIds = {
    admin: 'f7110198-db21-473d-b9b5-1e8b1b465e17',
    gestor: '0f0b83a8-3b6c-4733-8f6d-197946361394',
    atendimento: '8663ae22-3014-4996-a779-8b8d781bd8f6',
    leitor: 'a170ecfa-cf86-41e7-8bdf-19fb87a42c43',
  };
  const userIds = {
    admin: '15fc80ed-23c4-4874-8998-56e3d07cd4b7',
    gestor: 'aeed4987-2bd2-42a7-b70e-d38b7e2395d1',
    atendimento1: '12dada1f-0226-40e8-a38d-740b806a0671',
    atendimento2: '3ec47fe5-dbe5-46e9-8b60-09156c2f1fff',
    leitor: '02019099-853f-4b74-9a7d-1a92b4baca16',
  };
  const existingTenant = await prisma.tenant.findUnique({
    where: { name: 'Instituicao Exemplo' },
  });

  if (existingTenant && existingTenant.id !== tenantId) {
    await prisma.rolePermission.deleteMany({
      where: { tenantId: existingTenant.id },
    });
    await prisma.userRole.deleteMany({
      where: { tenantId: existingTenant.id },
    });
    await prisma.person.deleteMany({
      where: { tenantId: existingTenant.id },
    });
    await prisma.role.deleteMany({
      where: { tenantId: existingTenant.id },
    });
    await prisma.user.deleteMany({
      where: { tenantId: existingTenant.id },
    });
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'Instituicao Exemplo' },
    create: { id: tenantId, name: 'Instituicao Exemplo' },
  });

  const permissions = [
    { key: 'people.read', description: 'Ler pessoas' },
    { key: 'people.create', description: 'Criar pessoas' },
    { key: 'people.update', description: 'Atualizar pessoas' },
    { key: 'people.delete', description: 'Excluir pessoas' },
    { key: 'users.read', description: 'Ler usuarios' },
    { key: 'users.create', description: 'Criar usuarios' },
    { key: 'users.update', description: 'Atualizar usuarios' },
    { key: 'users.delete', description: 'Excluir usuarios' },
    { key: 'roles.manage', description: 'Gerenciar perfis e permissoes' },
    { key: 'tenants.read', description: 'Ler dados da instituicao' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const roleDefinitions = [
    {
      id: roleIds.admin,
      name: 'Admin',
      description: 'Administrador da instituicao',
      permissionKeys: allPermissions.map((permission) => permission.key),
    },
    {
      id: roleIds.gestor,
      name: 'Gestor',
      description: 'Gestao operacional',
      permissionKeys: [
        'people.read',
        'people.create',
        'people.update',
        'people.delete',
        'tenants.read',
      ],
    },
    {
      id: roleIds.atendimento,
      name: 'Atendimento',
      description: 'Equipe de atendimento',
      permissionKeys: ['people.read', 'people.create', 'people.update'],
    },
    {
      id: roleIds.leitor,
      name: 'Leitor',
      description: 'Acesso somente leitura',
      permissionKeys: ['people.read'],
    },
  ];

  for (const roleDefinition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: roleDefinition.name,
        },
      },
      update: {
        description: roleDefinition.description,
      },
      create: {
        id: roleDefinition.id,
        tenantId: tenant.id,
        name: roleDefinition.name,
        description: roleDefinition.description,
      },
    });

    for (const permissionKey of roleDefinition.permissionKeys) {
      const permission = allPermissions.find((item) => item.key === permissionKey);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: {
          tenantId_roleId_permissionId: {
            tenantId: tenant.id,
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const userPasswordHash = await bcrypt.hash('User@123', 10);
  const users = [
    {
      id: userIds.admin,
      email: 'admin@exemplo.com',
      passwordHash: adminPasswordHash,
      roleId: roleIds.admin,
    },
    {
      id: userIds.gestor,
      email: 'gestor@exemplo.com',
      passwordHash: userPasswordHash,
      roleId: roleIds.gestor,
    },
    {
      id: userIds.atendimento1,
      email: 'atendimento1@exemplo.com',
      passwordHash: userPasswordHash,
      roleId: roleIds.atendimento,
    },
    {
      id: userIds.atendimento2,
      email: 'atendimento2@exemplo.com',
      passwordHash: userPasswordHash,
      roleId: roleIds.atendimento,
    },
    {
      id: userIds.leitor,
      email: 'leitor@exemplo.com',
      passwordHash: userPasswordHash,
      roleId: roleIds.leitor,
    },
  ];

  for (const user of users) {
    const savedUser = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: user.email,
        },
      },
      update: {
        passwordHash: user.passwordHash,
        isActive: true,
      },
      create: {
        id: user.id,
        tenantId: tenant.id,
        email: user.email,
        passwordHash: user.passwordHash,
        isActive: true,
      },
    });

    await prisma.userRole.upsert({
      where: {
        tenantId_userId_roleId: {
          tenantId: tenant.id,
          userId: savedUser.id,
          roleId: user.roleId,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        userId: savedUser.id,
        roleId: user.roleId,
      },
    });
  }

  type SeedPerson = {
    id: string;
    fullName: string;
    socialName: string;
    email: string;
    phone: string;
    document: string;
    rg: string;
    nis: string;
    birthDate: Date;
    sex: string;
    gender: string;
    raceColor: string;
    maritalStatus: string;
    nationality: string;
    status: string;
    notes?: string;
    profileSummary?: string;
    avatarUrl?: string;
    tags?: string[];
    hasHealthIssue?: boolean;
    departureReason?: string;
  };

  const defaultAvatarUrl = '/avatar.jpg';
  const people: SeedPerson[] = [
    {
      id: '675d3227-da20-4e40-ab70-4b2a1011d728',
      fullName: 'Ana Pereira',
      socialName: 'Ana Pereira',
      email: 'ana.pereira@exemplo.com',
      phone: '+55 11 98888-1212',
      document: '111.222.333-44',
      rg: '44.556.677-1',
      nis: '123.45678.90-1',
      birthDate: new Date('1994-03-12'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
      tags: ['Agendar reuniÃ£o com os pais'],
      hasHealthIssue: false,
    },
    {
      id: '5a6afec4-5165-4f20-b394-d95b4d603fdd',
      fullName: 'Carlos Souza',
      socialName: 'Carlos Souza',
      email: 'carlos.souza@exemplo.com',
      phone: '+55 21 97777-2233',
      document: '222.333.444-55',
      rg: '22.334.445-2',
      nis: '321.65498.76-0',
      birthDate: new Date('1988-11-08'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Parda',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
      tags: ['Analisar mudanÃ§a de ciclo'],
      hasHealthIssue: true,
    },
    {
      id: 'c9e5539e-242a-4ef2-b5b7-3e9bd4c2dacf',
      fullName: 'Marina Lima',
      socialName: 'Marina Lima',
      email: 'marina.lima@exemplo.com',
      phone: '+55 31 96666-8899',
      document: '333.444.555-66',
      rg: '33.445.556-3',
      nis: '987.65432.10-9',
      birthDate: new Date('1979-07-27'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Preta',
      maritalStatus: 'Divorciada',
      nationality: 'Brasileira',
      status: 'Em analise',
      tags: ['Entrevista de acompanhamento'],
    },
    {
      id: 'c9fd7f0b-faf7-4cad-a38a-58b566e7e623',
      fullName: 'Beatriz Almeida',
      socialName: 'Bia Almeida',
      email: 'beatriz.almeida@exemplo.com',
      phone: '+55 11 97777-1212',
      document: '444.555.666-77',
      rg: '55.667.788-4',
      nis: '456.98765.43-2',
      birthDate: new Date('1992-08-20'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: 'cadb7788-7849-42f8-9be7-1d99ff793f00',
      fullName: 'Lucas Martins',
      socialName: 'Lucas Martins',
      email: 'lucas.martins@exemplo.com',
      phone: '+55 11 98888-3344',
      document: '555.666.777-88',
      rg: '66.778.899-5',
      nis: '567.12345.67-8',
      birthDate: new Date('1985-02-18'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Parda',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '7b4c445f-7009-4b73-a97e-a9468f2c1777',
      fullName: 'Fernanda Costa',
      socialName: 'Fernanda Costa',
      email: 'fernanda.costa@exemplo.com',
      phone: '+55 11 95555-3344',
      document: '666.777.888-99',
      rg: '77.889.900-6',
      nis: '678.54321.09-3',
      birthDate: new Date('1990-05-05'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '829f8d60-e82c-42b3-a6dd-97b60e508ad6',
      fullName: 'Diego Santos',
      socialName: 'Diego Santos',
      email: 'diego.santos@exemplo.com',
      phone: '+55 21 94444-5566',
      document: '777.888.999-00',
      rg: '88.990.011-7',
      nis: '789.65432.10-4',
      birthDate: new Date('1987-11-30'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Preta',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '4ae2c2df-8220-4234-86ed-43da9cea9025',
      fullName: 'Paula Ribeiro',
      socialName: 'Paula Ribeiro',
      email: 'paula.ribeiro@exemplo.com',
      phone: '+55 31 97777-8899',
      document: '888.999.000-11',
      rg: '99.001.122-8',
      nis: '890.76543.21-5',
      birthDate: new Date('1991-09-14'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Parda',
      maritalStatus: 'Divorciada',
      nationality: 'Brasileira',
      status: 'Em analise',
    },
    {
      id: '76a90a40-2a7a-40c4-9b0f-9cee5a56d96a',
      fullName: 'Rafael Oliveira',
      socialName: 'Rafael Oliveira',
      email: 'rafael.oliveira@exemplo.com',
      phone: '+55 21 96666-1122',
      document: '999.000.111-22',
      rg: '10.112.233-9',
      nis: '901.87654.32-6',
      birthDate: new Date('1983-03-10'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Branca',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: 'ac006735-d04b-4259-8025-86cd3fd6030c',
      fullName: 'Juliana Freitas',
      socialName: 'Juliana Freitas',
      email: 'juliana.freitas@exemplo.com',
      phone: '+55 41 98888-2211',
      document: '111.000.222-33',
      rg: '11.223.344-0',
      nis: '012.98765.43-7',
      birthDate: new Date('1996-07-22'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: 'b10ebb06-5f02-4e2e-ba20-197e1596570f',
      fullName: 'Gustavo Lima',
      socialName: 'Gustavo Lima',
      email: 'gustavo.lima@exemplo.com',
      phone: '+55 41 97777-3344',
      document: '222.111.333-44',
      rg: '22.334.455-1',
      nis: '123.09876.54-8',
      birthDate: new Date('1989-12-12'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Parda',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: 'cc184af4-e7cb-4235-9155-96accf0725e4',
      fullName: 'Patricia Ramos',
      socialName: 'Patricia Ramos',
      email: 'patricia.ramos@exemplo.com',
      phone: '+55 51 99999-5522',
      document: '333.222.444-55',
      rg: '33.445.566-2',
      nis: '234.10987.65-9',
      birthDate: new Date('1993-04-08'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '88006fc9-7db6-4e39-8e65-2c63ff0eb798',
      fullName: 'Henrique Duarte',
      socialName: 'Henrique Duarte',
      email: 'henrique.duarte@exemplo.com',
      phone: '+55 51 98888-6644',
      document: '444.333.555-66',
      rg: '44.556.677-3',
      nis: '345.21098.76-0',
      birthDate: new Date('1984-06-17'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Preta',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '583145fa-138e-47d0-a758-9732a9653172',
      fullName: 'Camila Torres',
      socialName: 'Camila Torres',
      email: 'camila.torres@exemplo.com',
      phone: '+55 61 97777-6655',
      document: '555.444.666-77',
      rg: '55.667.788-4',
      nis: '456.32109.87-1',
      birthDate: new Date('1997-01-30'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: 'bafaf3f1-1b66-4dfa-a78b-40e3d6799652',
      fullName: 'Leonardo Lopes',
      socialName: 'Leonardo Lopes',
      email: 'leonardo.lopes@exemplo.com',
      phone: '+55 61 98888-7788',
      document: '666.555.777-88',
      rg: '66.778.899-5',
      nis: '567.43210.98-2',
      birthDate: new Date('1982-10-05'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Parda',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '39b8f1ad-d8aa-41b4-9757-ad33b35b2314',
      fullName: 'Larissa Rocha',
      socialName: 'Larissa Rocha',
      email: 'larissa.rocha@exemplo.com',
      phone: '+55 71 97777-8899',
      document: '777.666.888-99',
      rg: '77.889.900-6',
      nis: '678.54321.09-3',
      birthDate: new Date('1995-09-09'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Em analise',
    },
    {
      id: 'd79704f6-378f-439f-b40d-9eea794fbd5b',
      fullName: 'Ricardo Nunes',
      socialName: 'Ricardo Nunes',
      email: 'ricardo.nunes@exemplo.com',
      phone: '+55 71 98888-9900',
      document: '888.777.999-00',
      rg: '88.990.011-7',
      nis: '789.65432.10-4',
      birthDate: new Date('1978-11-11'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Preta',
      maritalStatus: 'Divorciado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: 'c466a73a-503c-45ba-8d97-4c09e9f6c66d',
      fullName: 'Sabrina Melo',
      socialName: 'Sabrina Melo',
      email: 'sabrina.melo@exemplo.com',
      phone: '+55 81 97777-1122',
      document: '999.888.000-11',
      rg: '99.001.122-8',
      nis: '890.76543.21-5',
      birthDate: new Date('1999-04-15'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '722bbc89-d6b9-4931-b741-9e010c9a38ff',
      fullName: 'Felipe Araujo',
      socialName: 'Felipe Araujo',
      email: 'felipe.araujo@exemplo.com',
      phone: '+55 81 98888-2233',
      document: '101.111.222-33',
      rg: '11.223.344-9',
      nis: '901.87654.32-6',
      birthDate: new Date('1986-05-28'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Parda',
      maritalStatus: 'Casado',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '2e48d425-9f09-4cd1-bb32-4934ad5c07ee',
      fullName: 'Renata Vieira',
      socialName: 'Renata Vieira',
      email: 'renata.vieira@exemplo.com',
      phone: '+55 91 97777-4455',
      document: '212.222.333-44',
      rg: '22.334.455-0',
      nis: '012.98765.43-7',
      birthDate: new Date('1998-06-06'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '10f1e22d-1111-4a44-8c44-111111111111',
      fullName: 'Daniel Cruz',
      socialName: 'Daniel Cruz',
      email: 'daniel.cruz@exemplo.com',
      phone: '+55 11 96666-7788',
      document: '313.333.444-55',
      rg: '33.445.566-1',
      nis: '123.45678.90-1',
      birthDate: new Date('1991-02-02'),
      sex: 'Masculino',
      gender: 'Homem',
      raceColor: 'Parda',
      maritalStatus: 'Solteiro',
      nationality: 'Brasileira',
      status: 'Ativo',
    },
    {
      id: '20f2e33d-2222-4b55-8d55-222222222222',
      fullName: 'Isabela Castro',
      socialName: 'Isabela Castro',
      email: 'isabela.castro@exemplo.com',
      phone: '+55 11 95555-6677',
      document: '414.444.555-66',
      rg: '44.556.677-2',
      nis: '234.56789.01-2',
      birthDate: new Date('1990-12-18'),
      sex: 'Feminino',
      gender: 'Mulher',
      raceColor: 'Branca',
      maritalStatus: 'Casada',
      nationality: 'Brasileira',
      status: 'Em analise',
    },
  ];

  for (const person of people) {
    await prisma.person.upsert({
      where: {
        id: person.id,
      },
      update: {
        fullName: person.fullName,
        socialName: person.socialName,
        email: person.email,
        phone: person.phone,
        document: person.document,
        rg: person.rg,
        nis: person.nis,
        birthDate: person.birthDate,
        sex: person.sex,
        gender: person.gender,
        raceColor: person.raceColor,
        maritalStatus: person.maritalStatus,
        nationality: person.nationality,
        status: person.status,
        departureReason: person.departureReason,
        notes: person.notes,
        profileSummary: person.profileSummary,
        avatarUrl: person.avatarUrl,
        tags: person.tags ? JSON.stringify(person.tags) : null,
        hasHealthIssue: person.hasHealthIssue ?? false,
      },
      create: {
        id: person.id,
        tenantId: tenant.id,
        fullName: person.fullName,
        socialName: person.socialName,
        email: person.email,
        phone: person.phone,
        document: person.document,
        rg: person.rg,
        nis: person.nis,
        birthDate: person.birthDate,
        sex: person.sex,
        gender: person.gender,
        raceColor: person.raceColor,
        maritalStatus: person.maritalStatus,
        nationality: person.nationality,
        status: person.status,
        departureReason: person.departureReason ?? null,
        notes: person.notes ?? 'Cadastro inicial.',
        profileSummary:
          person.profileSummary ?? '<p>Cadastro base para testes.</p>',
        avatarUrl: person.avatarUrl ?? defaultAvatarUrl,
        tags: person.tags ? JSON.stringify(person.tags) : null,
        hasHealthIssue: person.hasHealthIssue ?? false,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });


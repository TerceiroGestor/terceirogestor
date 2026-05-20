# Blueprint Canonico de Modulo Backend

## Objetivo

Definir um blueprint unico para modulos backend NestJS/Prisma com foco em:

- organizacao previsivel
- separacao clara de responsabilidades
- baixo acoplamento
- manutencao futura
- replicacao consistente entre modulos

Este blueprint usa o modulo `person` como referencia inicial de organizacao, sem transformar o modulo em regra absoluta quando o dominio nao exigir todas as camadas.

---

## Quando aplicar

Aplicar este blueprint em:

- novos modulos backend com CRUD operacional
- refatoracoes incrementais de modulos legados
- extracoes de responsabilidade em services grandes

Nao aplicar com overengineering em:

- modulos triviais sem regra de negocio relevante
- wrappers tecnicos pequenos sem dominio proprio

---

## Estrutura canonica

```text
backend/src/modules/<domain>/
  presentation/
    controllers/
    dto/
    mappers/
  application/
    use-cases/
    services/
    queries/
    mappers/
  domain/
    constants/
    catalogs/
    normalizers/
    validators/
    policies/
    types/
  infrastructure/
    persistence/
    repositories/
    storage/
  <domain>.module.ts
```

### Regra de simplificacao

- nem toda pasta precisa nascer preenchida
- criar apenas a menor quantidade de estrutura necessaria
- quando o modulo for simples, `services/` pode nao existir e os `use-cases/` podem ser injetados direto
- quando o modulo ainda estiver em transicao, arquivos legados no raiz do modulo sao permitidos apenas como compatibilidade temporaria documentada

---

## Responsabilidade por camada

### presentation

Responsavel por:

- controller HTTP
- DTOs de request/response
- adaptacao de parametros HTTP para fluxo de aplicacao

Nao deve conter:

- regra de negocio
- acesso direto ao Prisma
- montagem de payload de persistencia

### application

Responsavel por:

- orquestracao de casos de uso
- coordenacao entre validacoes, policies, repositorios e mappers
- builders de queries de listagem
- mapeamento para persistencia e resposta

Nao deve conter:

- detalhes HTTP
- decorators Nest fora do estritamente necessario em classes injetaveis
- regra de infraestrutura espalhada

### domain

Responsavel por:

- regras puras do dominio
- normalizacao de campos
- validacoes de regra
- policies condicionais
- constantes e catalogos do dominio

Nao deve conter:

- imports de controller
- dependencia de request HTTP
- acesso a banco

### infrastructure

Responsavel por:

- repositorios Prisma
- policies tecnicas de storage e upload
- adaptadores externos
- detalhes concretos de persistencia

Nao deve conter:

- regra de negocio fora do escopo tecnico

---

## Convenoes de naming

- pasta de modulo backend: singular do dominio interno (`person`, `role`, `tenant`)
- classe principal do modulo: singular (`PersonModule`)
- service de transicao: singular (`PersonService`)
- use case: verbo + dominio (`CreatePersonUseCase`)
- repository: dominio + papel (`PersonRepository`)
- query builder: dominio + intencao (`person-list.query.ts`)
- mapper: dominio + destino (`person-response.mapper.ts`, `person-persistence.mapper.ts`)
- validator: dominio + regra (`person-status.validator.ts`)
- policy: dominio + contexto (`person-relation.policy.ts`)

### Compatibilidade externa

Quando houver legado, manter divergencias apenas se documentadas:

- rota pode permanecer plural por compatibilidade
- permissao pode permanecer em chave legada
- path publico legado pode permanecer temporariamente

Regra obrigatoria:

- nomenclatura interna nova sempre deve ficar consolidada no dominio e na aplicacao

---

## Ordem recomendada de extracao em modulos legados

Quando um service estiver grande e misturando responsabilidades, extrair nesta ordem:

1. constantes textuais e catalogos
2. normalizadores
3. validators e policies
4. mappers DTO -> persistencia
5. mappers entity -> response
6. builders de listagem, filtro e ordenacao
7. repositorios
8. use cases

Motivo:

- reduz risco
- preserva comportamento
- melhora legibilidade sem reescrever o modulo inteiro de uma vez

---

## Blueprint minimo por tipo de fluxo

### CRUD simples

Obrigatorio:

- `presentation/dto`
- `application/mappers`
- `application/queries` se houver listagem
- `domain/constants` quando houver catalogos fixos
- `domain/validators` quando houver regra de validacao

Opcional:

- `use-cases`
- `repositories`

### CRUD com regra de negocio moderada

Obrigatorio:

- `use-cases`
- `domain/normalizers`
- `domain/validators`
- `domain/policies`
- `application/mappers`
- `application/queries`

### Modulo sensivel com PII, auditoria ou integracao externa

Obrigatorio:

- `infrastructure/persistence`
- `infrastructure/storage`
- `domain/policies`
- documentacao explicita das compatibilidades e dos pontos sensiveis

---

## Checklist de criacao de modulo

Antes de abrir um novo modulo backend:

- definir nome interno singular do dominio
- validar tenancy obrigatoria
- validar permissao por rota
- decidir se existe compatibilidade externa legada
- definir DTOs de create, update e list
- definir onde ficam normalizadores, validators e policies
- definir mappers de persistencia e response
- definir se ja precisa de repository
- definir se o service sera apenas fachada ou se os use cases serao injetados diretamente
- registrar divergencias em `docs/shared/decisions.md`

---

## Checklist de refatoracao de modulo existente

- identificar o service dominante
- localizar regras puras misturadas no service
- extrair primeiro o que nao muda contrato externo
- manter aliases legados apenas como ponte documentada
- validar tenancy, autorizacao, auditoria e PII apos cada extracao
- nao renomear rotas, permissao ou banco no mesmo passo se isso ampliar risco sem necessidade

---

## Exemplo de distribuicao por responsabilidade

```text
presentation/controllers/person.controller.ts
  -> recebe request
  -> resolve tenant e auth
  -> chama use case

application/use-cases/create-person.use-case.ts
  -> aplica validator/policy
  -> chama mapper de persistencia
  -> salva via repository ou prisma
  -> retorna mapper de response

domain/validators/person-status.validator.ts
  -> regra pura de dominio

application/mappers/person-persistence.mapper.ts
  -> traduz DTO/input para payload de persistencia

infrastructure/persistence/person-upload-path.policy.ts
  -> regra tecnica de armazenamento legada/atual
```

---

## Esqueleto minimo replicavel

### module

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { RequestContextModule } from '../../core/request-context/request-context.module';
import { ExampleController } from './presentation/controllers/example.controller';
import { ExampleService } from './application/services/example.service';

@Module({
  imports: [PrismaModule, RequestContextModule],
  controllers: [ExampleController],
  providers: [ExampleService],
})
export class ExampleModule {}
```

### controller

```ts
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/authorization/permissions.guard';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { JwtUser } from '../../../core/auth/strategies/jwt.strategy';
import { CreateExampleDto } from '../dto/create-example.dto';
import { ListExampleQueryDto } from '../dto/list-example-query.dto';
import { ExampleService } from '../../application/services/example.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('examples')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post()
  @Permissions('examples.create')
  create(
    @CurrentUser() user: JwtUser | undefined,
    @Body() dto: CreateExampleDto,
  ) {
    return this.exampleService.create(this.getTenantId(user), dto);
  }

  @Get()
  @Permissions('examples.read')
  findAll(
    @CurrentUser() user: JwtUser | undefined,
    @Query() query: ListExampleQueryDto,
  ) {
    return this.exampleService.findAll(this.getTenantId(user), query);
  }

  private getTenantId(user: JwtUser | undefined) {
    if (!user?.tenantId) {
      throw new Error('Tenant ausente no contexto autenticado.');
    }
    return user.tenantId;
  }
}
```

### service de transicao ou fachada

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { buildCreateExampleData } from '../mappers/example-persistence.mapper';
import { buildExampleWhere } from '../queries/example-list.query';
import { mapExample } from '../mappers/example-response.mapper';
import { CreateExampleDto } from '../../presentation/dto/create-example.dto';
import { ListExampleQueryDto } from '../../presentation/dto/list-example-query.dto';

@Injectable()
export class ExampleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateExampleDto) {
    const created = await this.prisma.example.create({
      data: buildCreateExampleData(tenantId, dto),
    });

    return mapExample(created);
  }

  async findAll(tenantId: string, query: ListExampleQueryDto) {
    const where = buildExampleWhere({ tenantId, query: query.q, filters: [] });
    const records = await this.prisma.example.findMany({ where });
    return records.map(mapExample);
  }
}
```

### mapper de persistencia

```ts
import { normalizeString } from '../../../core/utils/strings';
import { CreateExampleDto } from '../../presentation/dto/create-example.dto';

export const buildCreateExampleData = (
  tenantId: string,
  dto: CreateExampleDto,
) => ({
  tenantId,
  name: normalizeString(dto.name),
  notes: normalizeString(dto.notes),
});
```

### query builder

```ts
import type { Prisma } from '../../../generated/prisma';

export const buildExampleWhere = ({
  tenantId,
  query,
}: {
  tenantId: string;
  query?: string;
}): Prisma.ExampleWhereInput => ({
  tenantId,
  ...(query
    ? {
        OR: [{ name: { contains: query.trim() } }],
      }
    : {}),
});
```

### validator

```ts
import { BadRequestException } from '@nestjs/common';

export const assertExampleName = (name: string | null | undefined) => {
  if (!name) {
    throw new BadRequestException('Nome obrigatorio.');
  }
};
```

### repository quando o modulo crescer

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class ExampleRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: unknown) {
    return this.prisma.example.create({ data });
  }

  findMany(where: unknown) {
    return this.prisma.example.findMany({ where });
  }
}
```

---

## Regras de qualidade

- controller nao monta payload Prisma
- DTO nao vira entidade de dominio
- dominio nao importa Nest HTTP
- service grande deve perder responsabilidade por extracao incremental
- compatibilidade legada deve ficar centralizada, nunca espalhada em varios arquivos sem contrato

---

## Padrao de adocao incremental

Fase 1:

- extrair constants, normalizers, validators, policies, mappers e queries

Fase 2:

- introduzir repositories e use cases por fluxo principal

Fase 3:

- remover aliases legados
- remover caminhos e nomes externos antigos
- consolidar testes por camada

---

## Referencia atual no codigo

Implementacoes ja aderentes parcialmente:

- `backend/src/modules/person/domain/constants`
- `backend/src/modules/person/domain/normalizers`
- `backend/src/modules/person/domain/validators`
- `backend/src/modules/person/domain/policies`
- `backend/src/modules/person/application/mappers`
- `backend/src/modules/person/application/queries`
- `backend/src/modules/person/infrastructure/persistence`

Este blueprint deve ser usado como alvo para os proximos modulos e para as proximas ondas de refatoracao do proprio `person`.

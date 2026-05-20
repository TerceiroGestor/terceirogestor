import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { PERSON_DETAIL_INCLUDE } from '../persistence/person-prisma.constants';

@Injectable()
export class PersonRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    data: Prisma.PersonUncheckedCreateInput,
  ) {
    return this.prisma.person.create({
      data: {
        ...data,
        tenantId,
      },
      include: PERSON_DETAIL_INCLUDE,
    });
  }

  findManyWithHealthCounts(args: {
    where: Prisma.PersonWhereInput;
    orderBy: Prisma.PersonOrderByWithRelationInput[];
    skip?: number;
    take?: number;
  }) {
    return this.prisma.person.findMany({
      where: args.where,
      orderBy: args.orderBy,
      skip: args.skip,
      take: args.take,
      include: {
        _count: {
          select: { healthConditions: true, medications: true },
        },
      },
    });
  }

  count(where: Prisma.PersonWhereInput) {
    return this.prisma.person.count({ where });
  }

  findDetailById(tenantId: string, id: string) {
    return this.prisma.person.findFirst({
      where: { id, tenantId },
      include: PERSON_DETAIL_INCLUDE,
    });
  }

  existsById(tenantId: string, id: string) {
    return this.prisma.person.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
  }

  update(id: string, data: Prisma.PersonUpdateInput) {
    return this.prisma.person.update({
      where: { id },
      data,
    });
  }
}
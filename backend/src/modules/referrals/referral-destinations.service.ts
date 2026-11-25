import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import type { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { PrismaService } from '../../core/prisma/prisma.service';
import { normalizeString } from '../../core/utils/strings';
import { CreateReferralDestinationDto } from './dto/create-referral-destination.dto';
import { ListReferralDestinationsQueryDto } from './dto/list-referral-destinations-query.dto';
import { UpdateReferralDestinationDto } from './dto/update-referral-destination.dto';

export function buildReferralDestinationWhere({
  tenantId,
  query,
}: {
  tenantId: string;
  query: ListReferralDestinationsQueryDto;
}): Prisma.ReferralDestinationWhereInput {
  const where: Prisma.ReferralDestinationWhereInput = { tenantId };

  const search = normalizeString(query.q);
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  return where;
}

@Injectable()
export class ReferralDestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: JwtUser, query: ListReferralDestinationsQueryDto) {
    const where = buildReferralDestinationWhere({
      tenantId: user.tenantId,
      query,
    });
    const data = await this.prisma.referralDestination.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  async get(user: JwtUser, destinationId: string) {
    return this.ensureDestinationExists(user.tenantId, destinationId);
  }

  async create(user: JwtUser, dto: CreateReferralDestinationDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Nome da rede de destino e obrigatorio');
    }

    return this.prisma.referralDestination.create({
      data: {
        tenantId: user.tenantId,
        name,
        contactInfo: normalizeString(dto.contactInfo),
        responsibleName: normalizeString(dto.responsibleName),
        address: normalizeString(dto.address),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(
    user: JwtUser,
    destinationId: string,
    dto: UpdateReferralDestinationDto,
  ) {
    await this.ensureDestinationExists(user.tenantId, destinationId);

    return this.prisma.referralDestination.update({
      where: { id: destinationId },
      data: {
        name: dto.name?.trim() ? dto.name.trim() : undefined,
        contactInfo:
          dto.contactInfo !== undefined
            ? normalizeString(dto.contactInfo)
            : undefined,
        responsibleName:
          dto.responsibleName !== undefined
            ? normalizeString(dto.responsibleName)
            : undefined,
        address:
          dto.address !== undefined ? normalizeString(dto.address) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  private async ensureDestinationExists(
    tenantId: string,
    destinationId: string,
  ) {
    const destination = await this.prisma.referralDestination.findFirst({
      where: { id: destinationId, tenantId },
    });
    if (!destination) {
      throw new NotFoundException('Rede de destino nao encontrada');
    }
    return destination;
  }
}

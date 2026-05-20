import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RequestContextService } from '../../../core/request-context/request-context.service';
import { ConfirmTenantRegistrationDto } from '../../dto/confirm-tenant-registration.dto';
import { RegistrationRepository } from '../../infrastructure/repositories/registration.repository';
import { RegistrationSessionService } from '../services/registration-session.service';

@Injectable()
export class ConfirmRegistrationUseCase {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly registrationSessionService: RegistrationSessionService,
    private readonly requestContext: RequestContextService,
  ) {}

  async execute(
    dto: ConfirmTenantRegistrationDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ) {
    const reg = await this.registrationRepository.findRegistrationById(
      dto.registrationId,
    );
    if (!reg) throw new NotFoundException('Registro nao encontrado');
    if (reg.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Registro nao esta aguardando confirmacao');
    }
    if (!reg.adminEmail) {
      throw new BadRequestException('Email do admin nao definido');
    }
    if (!reg.adminName) {
      throw new BadRequestException('Nome do admin nao definido');
    }
    if (!reg.verificationCodeHash || !reg.verificationCodeExpiresAt) {
      throw new BadRequestException('Codigo nao disponivel');
    }
    if (reg.verificationCodeExpiresAt <= new Date()) {
      throw new BadRequestException('Codigo expirado');
    }

    const codeOk = await bcrypt.compare(
      dto.code.trim(),
      reg.verificationCodeHash,
    );
    if (!codeOk) throw new BadRequestException('Codigo invalido');

    const adminPasswordHash =
      reg.adminPasswordHash ??
      (dto.password ? await bcrypt.hash(dto.password, 10) : null);
    if (!adminPasswordHash) {
      throw new BadRequestException('Defina uma senha para continuar');
    }

    this.requestContext.update({ disableAudit: true });

    const result = await this.registrationRepository.confirmPendingRegistration({
      registrationId: reg.id,
      tenantName: reg.tenantName,
      tenantSlug: reg.tenantSlug,
      adminName: reg.adminName,
      adminEmail: reg.adminEmail,
      adminPasswordHash,
    });

    this.requestContext.update({
      disableAudit: false,
      tenantId: result.tenantId,
      userId: result.userId,
    });

    const tokens = await this.registrationSessionService.issueTokensForUser(
      result.userId,
      meta,
    );

    return { ...result, ...tokens };
  }
}
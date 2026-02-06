import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { CreatePersonDto } from './dto/create-person.dto';
import { ListPeopleQueryDto } from './dto/list-people-query.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PeopleService } from './people.service';

@UseGuards(JwtAuthGuard)
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  async create(
    @CurrentUser() user: JwtUser | undefined,
    @Body() dto: CreatePersonDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: JwtUser | undefined,
    @Query() query: ListPeopleQueryDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.findAll(tenantId, query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.findById(tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePersonDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.remove(tenantId, id);
  }

  private getTenantId(user?: JwtUser): string {
    if (!user?.tenantId) {
      throw new UnauthorizedException('Token invalid');
    }

    return user.tenantId;
  }
}


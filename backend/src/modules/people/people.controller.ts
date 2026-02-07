import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { JwtUser } from '../../core/auth/strategies/jwt.strategy';
import { CreateHouseholdAssetDto } from './dto/create-household-asset.dto';
import { CreatePersonAssetDto } from './dto/create-person-asset.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreatePersonIncomeDto } from './dto/create-person-income.dto';
import { CreatePersonRelationDto } from './dto/create-person-relation.dto';
import { ListPeopleQueryDto } from './dto/list-people-query.dto';
import { UpdateHouseholdAssetDto } from './dto/update-household-asset.dto';
import { UpsertHouseholdProfileDto } from './dto/upsert-household-profile.dto';
import { UpdatePersonAssetDto } from './dto/update-person-asset.dto';
import { UpdatePersonIncomeDto } from './dto/update-person-income.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdatePersonRelationDto } from './dto/update-person-relation.dto';
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

  @Get(':id/incomes')
  async listIncomes(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listIncomes(tenantId, id);
  }

  @Post(':id/incomes')
  async createIncome(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePersonIncomeDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createIncome(tenantId, id, dto);
  }

  @Patch(':id/incomes/:incomeId')
  async updateIncome(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('incomeId', new ParseUUIDPipe({ version: '4' }))
    incomeId: string,
    @Body() dto: UpdatePersonIncomeDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updateIncome(tenantId, id, incomeId, dto);
  }

  @Delete(':id/incomes/:incomeId')
  async removeIncome(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('incomeId', new ParseUUIDPipe({ version: '4' }))
    incomeId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removeIncome(tenantId, id, incomeId);
  }

  @Get(':id/household-assets')
  async listHouseholdAssets(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listHouseholdAssets(tenantId, id);
  }

  @Post(':id/household-assets')
  async createHouseholdAsset(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateHouseholdAssetDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createHouseholdAsset(tenantId, id, dto);
  }

  @Patch(':id/household-assets/:assetId')
  async updateHouseholdAsset(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
    @Body() dto: UpdateHouseholdAssetDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updateHouseholdAsset(
      tenantId,
      id,
      assetId,
      dto,
    );
  }

  @Delete(':id/household-assets/:assetId')
  async removeHouseholdAsset(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removeHouseholdAsset(tenantId, id, assetId);
  }

  @Get(':id/person-assets')
  async listPersonAssets(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listPersonAssets(tenantId, id);
  }

  @Get(':id/household-person-assets')
  async listHouseholdPersonAssets(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listHouseholdPersonAssets(tenantId, id);
  }

  @Post(':id/person-assets')
  async createPersonAsset(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePersonAssetDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createPersonAsset(tenantId, id, dto);
  }

  @Patch(':id/person-assets/:assetId')
  async updatePersonAsset(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
    @Body() dto: UpdatePersonAssetDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updatePersonAsset(tenantId, id, assetId, dto);
  }

  @Delete(':id/person-assets/:assetId')
  async removePersonAsset(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removePersonAsset(tenantId, id, assetId);
  }

  @Get(':id/household-profile')
  async getHouseholdProfile(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.getHouseholdProfile(tenantId, id);
  }

  @Put(':id/household-profile')
  async upsertHouseholdProfile(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpsertHouseholdProfileDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.upsertHouseholdProfile(tenantId, id, dto);
  }

  @Get(':id/family-income-summary')
  async getFamilyIncomeSummary(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.getFamilyIncomeSummary(tenantId, id);
  }

  @Get(':id/relations')
  async listRelations(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listRelations(tenantId, id);
  }

  @Post(':id/relations')
  async createRelation(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePersonRelationDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createRelation(tenantId, id, dto);
  }

  @Patch(':id/relations/:relationId')
  async updateRelation(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('relationId', new ParseUUIDPipe({ version: '4' }))
    relationId: string,
    @Body() dto: UpdatePersonRelationDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updateRelation(tenantId, id, relationId, dto);
  }

  @Delete(':id/relations/:relationId')
  async removeRelation(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('relationId', new ParseUUIDPipe({ version: '4' }))
    relationId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removeRelation(tenantId, id, relationId);
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


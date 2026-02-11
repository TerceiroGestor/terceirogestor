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
import { CreatePersonExpenseDto } from './dto/create-person-expense.dto';
import { CreatePersonHealthConditionDto } from './dto/create-person-health-condition.dto';
import { CreatePersonIncomeDto } from './dto/create-person-income.dto';
import { CreatePersonMedicationDto } from './dto/create-person-medication.dto';
import { CreatePersonRelationDto } from './dto/create-person-relation.dto';
import { CreateHouseholdTransferDto } from './dto/create-household-transfer.dto';
import { ListPeopleQueryDto } from './dto/list-people-query.dto';
import { UpdateHouseholdAssetDto } from './dto/update-household-asset.dto';
import { UpsertHouseholdProfileDto } from './dto/upsert-household-profile.dto';
import { UpdatePersonAssetDto } from './dto/update-person-asset.dto';
import { UpdatePersonExpenseDto } from './dto/update-person-expense.dto';
import { UpdatePersonHealthConditionDto } from './dto/update-person-health-condition.dto';
import { UpdatePersonIncomeDto } from './dto/update-person-income.dto';
import { UpdatePersonMedicationDto } from './dto/update-person-medication.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdateHouseholdTransferDto } from './dto/update-household-transfer.dto';
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

  @Get(':id/expenses')
  async listExpenses(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listExpenses(tenantId, id);
  }

  @Post(':id/expenses')
  async createExpense(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePersonExpenseDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createExpense(tenantId, id, dto);
  }

  @Patch(':id/expenses/:expenseId')
  async updateExpense(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('expenseId', new ParseUUIDPipe({ version: '4' }))
    expenseId: string,
    @Body() dto: UpdatePersonExpenseDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updateExpense(tenantId, id, expenseId, dto);
  }

  @Delete(':id/expenses/:expenseId')
  async removeExpense(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('expenseId', new ParseUUIDPipe({ version: '4' }))
    expenseId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removeExpense(tenantId, id, expenseId);
  }

  @Get(':id/health-conditions')
  async listHealthConditions(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listHealthConditions(tenantId, id);
  }

  @Post(':id/health-conditions')
  async createHealthCondition(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePersonHealthConditionDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createHealthCondition(tenantId, id, dto);
  }

  @Patch(':id/health-conditions/:conditionId')
  async updateHealthCondition(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('conditionId', new ParseUUIDPipe({ version: '4' }))
    conditionId: string,
    @Body() dto: UpdatePersonHealthConditionDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updateHealthCondition(
      tenantId,
      id,
      conditionId,
      dto,
    );
  }

  @Delete(':id/health-conditions/:conditionId')
  async removeHealthCondition(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('conditionId', new ParseUUIDPipe({ version: '4' }))
    conditionId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removeHealthCondition(tenantId, id, conditionId);
  }

  @Get(':id/medications')
  async listMedications(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listMedications(tenantId, id);
  }

  @Post(':id/medications')
  async createMedication(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePersonMedicationDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createMedication(tenantId, id, dto);
  }

  @Patch(':id/medications/:medicationId')
  async updateMedication(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('medicationId', new ParseUUIDPipe({ version: '4' }))
    medicationId: string,
    @Body() dto: UpdatePersonMedicationDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updateMedication(
      tenantId,
      id,
      medicationId,
      dto,
    );
  }

  @Delete(':id/medications/:medicationId')
  async removeMedication(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('medicationId', new ParseUUIDPipe({ version: '4' }))
    medicationId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removeMedication(tenantId, id, medicationId);
  }

  @Get(':id/transfers')
  async listTransfers(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listTransfers(tenantId, id);
  }

  @Post(':id/transfers')
  async createTransfer(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateHouseholdTransferDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.createTransfer(tenantId, id, dto);
  }

  @Patch(':id/transfers/:transferId')
  async updateTransfer(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('transferId', new ParseUUIDPipe({ version: '4' }))
    transferId: string,
    @Body() dto: UpdateHouseholdTransferDto,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.updateTransfer(tenantId, id, transferId, dto);
  }

  @Delete(':id/transfers/:transferId')
  async removeTransfer(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('transferId', new ParseUUIDPipe({ version: '4' }))
    transferId: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.removeTransfer(tenantId, id, transferId);
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

  @Get(':id/family-summary')
  async getFamilySummary(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.getFamilySummary(tenantId, id);
  }

  @Get(':id/relations')
  async listRelations(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const tenantId = this.getTenantId(user);
    return this.peopleService.listRelations(tenantId, id);
  }

  @Get(':id/relations-tree')
  async listRelationsTree(
    @CurrentUser() user: JwtUser | undefined,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('depth') depth?: string,
  ) {
    const tenantId = this.getTenantId(user);
    const parsedDepth = depth ? Number(depth) : undefined;
    return this.peopleService.listRelationsTree(tenantId, id, parsedDepth);
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


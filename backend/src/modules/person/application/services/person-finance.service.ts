import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parseDateInput } from '../../../../core/utils/dates';
import { normalizeString } from '../../../../core/utils/strings';
import {
  mapExpense,
  mapFinancialEntry,
  mapIncome,
} from '../mappers/person-response.mapper';
import {
  resolveFinancialEntryType,
  resolveIncomeFrequency,
} from '../../domain/normalizers/person-field.normalizer';
import type {
  CreatePersonExpenseInput,
  CreatePersonFinancialEntryInput,
  CreatePersonIncomeInput,
  UpdatePersonExpenseInput,
  UpdatePersonFinancialEntryInput,
  UpdatePersonIncomeInput,
} from '../types/person-finance.input';
import { PersonFinanceRepository } from '../../infrastructure/repositories/person-finance.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

@Injectable()
export class PersonFinanceService {
  constructor(
    private readonly personRepository: PersonRepository,
    private readonly personFinanceRepository: PersonFinanceRepository,
  ) {}

  async listIncomes(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const incomes = await this.personFinanceRepository.listIncomes(
      tenantId,
      personId,
    );
    return incomes.map(mapIncome);
  }

  async listFinancialEntries(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const entries = await this.personFinanceRepository.listFinancialEntries(
      tenantId,
      personId,
    );
    return entries.map(mapFinancialEntry);
  }

  async createFinancialEntry(
    tenantId: string,
    personId: string,
    input: CreatePersonFinancialEntryInput,
  ) {
    await this.assertPersonExists(tenantId, personId);

    const category = normalizeString(input.category);
    if (!category) {
      throw new BadRequestException('Categoria financeira invalida.');
    }

    const householdId = await this.resolveHouseholdId(
      tenantId,
      personId,
      input.householdId,
    );

    const entry = await this.personFinanceRepository.createFinancialEntry({
      tenantId,
      personId,
      entryType: resolveFinancialEntryType(input.entryType),
      category,
      subcategory: normalizeString(input.subcategory),
      status: normalizeString(input.status),
      amount:
        input.amount !== undefined && input.amount !== null ? input.amount : null,
      frequency: resolveIncomeFrequency(input.frequency),
      contractType: normalizeString(input.contractType),
      householdId,
      fromHouseholdId: normalizeString(input.fromHouseholdId),
      toHouseholdId: normalizeString(input.toHouseholdId),
      includeInHouseholdBudget: input.includeInHouseholdBudget ?? true,
      startDate: input.startDate ? (parseDateInput(input.startDate) ?? null) : null,
      endDate: input.endDate ? (parseDateInput(input.endDate) ?? null) : null,
      notes: normalizeString(input.notes),
    });

    return mapFinancialEntry(entry);
  }

  async updateFinancialEntry(
    tenantId: string,
    personId: string,
    entryId: string,
    input: UpdatePersonFinancialEntryInput,
  ) {
    const existing = await this.personFinanceRepository.findFinancialEntry(
      tenantId,
      personId,
      entryId,
    );
    if (!existing) {
      throw new NotFoundException('Registro financeiro nao encontrado.');
    }

    const householdId =
      input.householdId !== undefined
        ? await this.resolveHouseholdId(tenantId, personId, input.householdId)
        : undefined;
    const category =
      input.category !== undefined
        ? (normalizeString(input.category) ?? undefined)
        : undefined;
    if (input.category !== undefined && category === undefined) {
      throw new BadRequestException('Categoria financeira invalida.');
    }

    const updated = await this.personFinanceRepository.updateFinancialEntry(
      entryId,
      {
        entryType:
          input.entryType !== undefined
            ? resolveFinancialEntryType(input.entryType)
            : undefined,
        category,
        subcategory:
          input.subcategory !== undefined
            ? normalizeString(input.subcategory)
            : undefined,
        status:
          input.status !== undefined ? normalizeString(input.status) : undefined,
        amount:
          input.amount !== undefined && input.amount !== null
            ? input.amount
            : input.amount === null
              ? null
              : undefined,
        frequency:
          input.frequency !== undefined
            ? resolveIncomeFrequency(input.frequency)
            : undefined,
        contractType:
          input.contractType !== undefined
            ? normalizeString(input.contractType)
            : undefined,
        householdId,
        fromHouseholdId:
          input.fromHouseholdId !== undefined
            ? normalizeString(input.fromHouseholdId)
            : undefined,
        toHouseholdId:
          input.toHouseholdId !== undefined
            ? normalizeString(input.toHouseholdId)
            : undefined,
        includeInHouseholdBudget:
          input.includeInHouseholdBudget !== undefined
            ? input.includeInHouseholdBudget
            : undefined,
        startDate:
          input.startDate !== undefined
            ? input.startDate
              ? (parseDateInput(input.startDate) ?? null)
              : null
            : undefined,
        endDate:
          input.endDate !== undefined
            ? input.endDate
              ? (parseDateInput(input.endDate) ?? null)
              : null
            : undefined,
        notes:
          input.notes !== undefined ? normalizeString(input.notes) : undefined,
      },
    );

    return mapFinancialEntry(updated);
  }

  async removeFinancialEntry(
    tenantId: string,
    personId: string,
    entryId: string,
  ) {
    const existing = await this.personFinanceRepository.findFinancialEntry(
      tenantId,
      personId,
      entryId,
    );
    if (!existing) {
      throw new NotFoundException('Registro financeiro nao encontrado.');
    }
    await this.personFinanceRepository.deleteFinancialEntry(entryId);
    return { deleted: true };
  }

  async listExpenses(tenantId: string, personId: string) {
    await this.assertPersonExists(tenantId, personId);
    const expenses = await this.personFinanceRepository.listExpenses(
      tenantId,
      personId,
    );
    return expenses.map(mapExpense);
  }

  async createIncome(
    tenantId: string,
    personId: string,
    input: CreatePersonIncomeInput,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const householdId = await this.resolveHouseholdId(
      tenantId,
      personId,
      input.householdId,
    );
    const income = await this.personFinanceRepository.createIncome({
      tenantId,
      personId,
      householdId,
      type: normalizeString(input.type) ?? 'Outro',
      amount: input.amount,
      frequency: resolveIncomeFrequency(input.frequency),
      contractType: normalizeString(input.contractType),
      isHouseholdContribution: input.isHouseholdContribution ?? true,
      notes: normalizeString(input.notes),
    });
    return mapIncome(income);
  }

  async updateIncome(
    tenantId: string,
    personId: string,
    incomeId: string,
    input: UpdatePersonIncomeInput,
  ) {
    const income = await this.personFinanceRepository.findIncome(
      tenantId,
      personId,
      incomeId,
    );
    if (!income) {
      throw new NotFoundException('Renda nao encontrada.');
    }

    const updated = await this.personFinanceRepository.updateIncome(incomeId, {
      householdId:
        input.householdId !== undefined
          ? await this.resolveHouseholdId(tenantId, personId, input.householdId)
          : undefined,
      type:
        input.type !== undefined
          ? (normalizeString(input.type) ?? undefined)
          : undefined,
      amount: input.amount !== undefined ? input.amount : undefined,
      frequency:
        input.frequency !== undefined
          ? resolveIncomeFrequency(input.frequency)
          : undefined,
      contractType:
        input.contractType !== undefined
          ? normalizeString(input.contractType)
          : undefined,
      isHouseholdContribution:
        input.isHouseholdContribution !== undefined
          ? input.isHouseholdContribution
          : undefined,
      notes: input.notes !== undefined ? normalizeString(input.notes) : undefined,
    });

    return mapIncome(updated);
  }

  async createExpense(
    tenantId: string,
    personId: string,
    input: CreatePersonExpenseInput,
  ) {
    await this.assertPersonExists(tenantId, personId);
    const householdId = await this.resolveHouseholdId(
      tenantId,
      personId,
      input.householdId,
    );
    const expense = await this.personFinanceRepository.createExpense({
      tenantId,
      personId,
      householdId,
      type: normalizeString(input.type) ?? 'Outro',
      amount: input.amount,
      frequency: resolveIncomeFrequency(input.frequency),
      isHouseholdExpense: input.isHouseholdExpense ?? true,
      notes: normalizeString(input.notes),
    });
    return mapExpense(expense);
  }

  async updateExpense(
    tenantId: string,
    personId: string,
    expenseId: string,
    input: UpdatePersonExpenseInput,
  ) {
    const expense = await this.personFinanceRepository.findExpense(
      tenantId,
      personId,
      expenseId,
    );
    if (!expense) {
      throw new NotFoundException('Gasto nao encontrado.');
    }

    const updated = await this.personFinanceRepository.updateExpense(expenseId, {
      householdId:
        input.householdId !== undefined
          ? await this.resolveHouseholdId(tenantId, personId, input.householdId)
          : undefined,
      type:
        input.type !== undefined
          ? (normalizeString(input.type) ?? undefined)
          : undefined,
      amount: input.amount !== undefined ? input.amount : undefined,
      frequency:
        input.frequency !== undefined
          ? resolveIncomeFrequency(input.frequency)
          : undefined,
      isHouseholdExpense:
        input.isHouseholdExpense !== undefined
          ? input.isHouseholdExpense
          : undefined,
      notes: input.notes !== undefined ? normalizeString(input.notes) : undefined,
    });

    return mapExpense(updated);
  }

  async removeExpense(tenantId: string, personId: string, expenseId: string) {
    const expense = await this.personFinanceRepository.findExpense(
      tenantId,
      personId,
      expenseId,
    );
    if (!expense) {
      throw new NotFoundException('Gasto nao encontrado.');
    }
    await this.personFinanceRepository.deleteExpense(expenseId);
    return { deleted: true };
  }

  async removeIncome(tenantId: string, personId: string, incomeId: string) {
    const income = await this.personFinanceRepository.findIncome(
      tenantId,
      personId,
      incomeId,
    );
    if (!income) {
      throw new NotFoundException('Renda nao encontrada.');
    }
    await this.personFinanceRepository.deleteIncome(incomeId);
    return { deleted: true };
  }

  private async assertPersonExists(tenantId: string, personId: string) {
    const person = await this.personRepository.existsById(tenantId, personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
  }

  private async resolveHouseholdId(
    tenantId: string,
    personId: string,
    householdId?: string | null,
  ) {
    if (householdId === null) return null;
    if (householdId) {
      const household = await this.personFinanceRepository.findHousehold(
        tenantId,
        householdId,
      );
      if (!household) {
        throw new BadRequestException('Residencia nao encontrada.');
      }
      return householdId;
    }

    const currentMember = await this.personFinanceRepository.findCurrentHouseholdMember(
      tenantId,
      personId,
    );
    if (currentMember) {
      return currentMember.householdId;
    }

    const anyMember = await this.personFinanceRepository.findLatestHouseholdMember(
      tenantId,
      personId,
    );
    return anyMember?.householdId ?? null;
  }
}
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../generated/prisma';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class PersonFinanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  listIncomes(tenantId: string, personId: string) {
    return this.prisma.personIncome.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listFinancialEntries(tenantId: string, personId: string) {
    return this.prisma.personFinancialEntry.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listExpenses(tenantId: string, personId: string) {
    return this.prisma.personExpense.findMany({
      where: { tenantId, personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findFinancialEntry(tenantId: string, personId: string, entryId: string) {
    return this.prisma.personFinancialEntry.findFirst({
      where: { id: entryId, tenantId, personId },
    });
  }

  createFinancialEntry(data: Prisma.PersonFinancialEntryUncheckedCreateInput) {
    return this.prisma.personFinancialEntry.create({ data });
  }

  updateFinancialEntry(entryId: string, data: Prisma.PersonFinancialEntryUpdateInput) {
    return this.prisma.personFinancialEntry.update({
      where: { id: entryId },
      data,
    });
  }

  deleteFinancialEntry(entryId: string) {
    return this.prisma.personFinancialEntry.delete({ where: { id: entryId } });
  }

  findIncome(tenantId: string, personId: string, incomeId: string) {
    return this.prisma.personIncome.findFirst({
      where: { id: incomeId, tenantId, personId },
    });
  }

  createIncome(data: Prisma.PersonIncomeUncheckedCreateInput) {
    return this.prisma.personIncome.create({ data });
  }

  updateIncome(incomeId: string, data: Prisma.PersonIncomeUpdateInput) {
    return this.prisma.personIncome.update({
      where: { id: incomeId },
      data,
    });
  }

  deleteIncome(incomeId: string) {
    return this.prisma.personIncome.delete({ where: { id: incomeId } });
  }

  findExpense(tenantId: string, personId: string, expenseId: string) {
    return this.prisma.personExpense.findFirst({
      where: { id: expenseId, tenantId, personId },
    });
  }

  createExpense(data: Prisma.PersonExpenseUncheckedCreateInput) {
    return this.prisma.personExpense.create({ data });
  }

  updateExpense(expenseId: string, data: Prisma.PersonExpenseUpdateInput) {
    return this.prisma.personExpense.update({
      where: { id: expenseId },
      data,
    });
  }

  deleteExpense(expenseId: string) {
    return this.prisma.personExpense.delete({ where: { id: expenseId } });
  }

  findHousehold(tenantId: string, householdId: string) {
    return this.prisma.household.findFirst({
      where: { id: householdId, tenantId },
    });
  }

  findCurrentHouseholdMember(tenantId: string, personId: string) {
    return this.prisma.householdMember.findFirst({
      where: { tenantId, personId, endDate: null },
      orderBy: { startDate: 'desc' },
    });
  }

  findLatestHouseholdMember(tenantId: string, personId: string) {
    return this.prisma.householdMember.findFirst({
      where: { tenantId, personId },
      orderBy: { startDate: 'desc' },
    });
  }
}
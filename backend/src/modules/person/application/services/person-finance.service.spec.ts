import { NotFoundException } from '@nestjs/common';
import { PersonFinanceService } from './person-finance.service';
import { PersonFinanceRepository } from '../../infrastructure/repositories/person-finance.repository';
import { PersonRepository } from '../../infrastructure/repositories/person.repository';

describe('PersonFinanceService', () => {
  const personRepository = {
    existsById: jest.fn(),
  } as unknown as jest.Mocked<PersonRepository>;
  const financeRepository = {
    listIncomes: jest.fn(),
    listFinancialEntries: jest.fn(),
    listExpenses: jest.fn(),
    findFinancialEntry: jest.fn(),
    createFinancialEntry: jest.fn(),
    updateFinancialEntry: jest.fn(),
    deleteFinancialEntry: jest.fn(),
    findIncome: jest.fn(),
    createIncome: jest.fn(),
    updateIncome: jest.fn(),
    deleteIncome: jest.fn(),
    findExpense: jest.fn(),
    createExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
    findHousehold: jest.fn(),
    findCurrentHouseholdMember: jest.fn(),
    findLatestHouseholdMember: jest.fn(),
  } as unknown as jest.Mocked<PersonFinanceRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    personRepository.existsById.mockResolvedValue({ id: 'person-1' } as never);
  });

  it('lists incomes for an existing person', async () => {
    financeRepository.listIncomes.mockResolvedValue([] as never);
    const service = new PersonFinanceService(personRepository, financeRepository);

    await expect(service.listIncomes('tenant-1', 'person-1')).resolves.toEqual([]);
  });

  it('throws when financial entry does not exist', async () => {
    financeRepository.findFinancialEntry.mockResolvedValue(null as never);
    const service = new PersonFinanceService(personRepository, financeRepository);

    await expect(
      service.removeFinancialEntry('tenant-1', 'person-1', 'entry-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
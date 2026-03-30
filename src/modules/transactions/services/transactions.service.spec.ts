/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Account } from '../../accounts/entities/account.entity';
import { ExchangeRate } from '../../exchange-rates/entities/exchange-rate.entity';
import { TransactionsService } from './transactions.service';
import { AccountStatus } from '../../../common/enums/account-status.enum';

describe('TransactionsService', () => {
  let service: TransactionsService;

  let transactionRepository: any;
  let accountRepository: any;
  let exchangeRateRepository: any;
  let dataSource: any;

  let manager: any;

  beforeEach(async () => {
    transactionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    accountRepository = {};
    exchangeRateRepository = {};

    manager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => cb(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
        {
          provide: getRepositoryToken(ExchangeRate),
          useValue: exchangeRateRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should deposit successfully', async () => {
    const account = {
      id: 'acc-1',
      balance: 100,
      currency: 'DOP',
      status: AccountStatus.ACTIVE,
    };

    const savedTransaction = {
      id: 'trx-1',
      amount: 50,
    };

    manager.findOne.mockResolvedValue(account);
    manager.save
      .mockResolvedValueOnce({ ...account, balance: 150 })
      .mockResolvedValueOnce(savedTransaction);
    manager.create.mockReturnValue(savedTransaction);

    const result = await service.deposit({
      accountId: 'acc-1',
      amount: 50,
      description: 'deposit',
    } as any);

    expect(result).toEqual(savedTransaction);
    expect(manager.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if account does not exist (deposit)', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(
      service.deposit({
        accountId: 'missing',
        amount: 50,
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should withdraw successfully', async () => {
    const account = {
      id: 'acc-1',
      balance: 100,
      currency: 'DOP',
      status: AccountStatus.ACTIVE,
    };

    const savedTransaction = { id: 'trx-2' };

    manager.findOne.mockResolvedValue(account);
    manager.save
      .mockResolvedValueOnce({ ...account, balance: 50 })
      .mockResolvedValueOnce(savedTransaction);
    manager.create.mockReturnValue(savedTransaction);

    const result = await service.withdraw({
      accountId: 'acc-1',
      amount: 50,
    } as any);

    expect(result).toEqual(savedTransaction);
  });

  it('should throw BadRequestException if insufficient funds (withdraw)', async () => {
    const account = {
      id: 'acc-1',
      balance: 20,
      status: AccountStatus.ACTIVE,
    };

    manager.findOne.mockResolvedValue(account);

    await expect(
      service.withdraw({
        accountId: 'acc-1',
        amount: 50,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should transfer successfully (same currency)', async () => {
    const source = {
      id: 'acc-1',
      balance: 100,
      currency: 'DOP',
      status: AccountStatus.ACTIVE,
    };

    const destination = {
      id: 'acc-2',
      balance: 50,
      currency: 'DOP',
      status: AccountStatus.ACTIVE,
    };

    const savedTransaction = { id: 'trx-3' };

    manager.findOne
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(destination);

    manager.save
      .mockResolvedValueOnce({ ...source, balance: 50 })
      .mockResolvedValueOnce({ ...destination, balance: 100 })
      .mockResolvedValueOnce(savedTransaction);

    manager.create.mockReturnValue(savedTransaction);

    const result = await service.transfer({
      sourceAccountId: 'acc-1',
      destinationAccountId: 'acc-2',
      amount: 50,
    } as any);

    expect(result).toEqual(savedTransaction);
  });

  it('should throw BadRequestException if transferring to same account', async () => {
    await expect(
      service.transfer({
        sourceAccountId: 'acc-1',
        destinationAccountId: 'acc-1',
        amount: 50,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});

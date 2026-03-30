import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from '../entities/account.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { AccountsService } from './accounts.service';
import { AccountStatus } from '../../../common/enums/account-status.enum';

describe('AccountsService', () => {
  let service: AccountsService;

  let accountRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let customerRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    accountRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    customerRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: accountRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an account successfully', async () => {
    const input = {
      accountNumber: 'ACC-1001',
      currency: 'DOP',
      customerId: 'customer-1',
    };

    const customer = {
      id: 'customer-1',
      firstName: 'Diego',
      email: 'diego@example.com',
    };

    const createdAccount = {
      id: 'account-1',
      accountNumber: input.accountNumber,
      currency: input.currency,
      status: AccountStatus.ACTIVE,
      balance: 0,
      customer,
    };

    accountRepository.findOne.mockResolvedValue(null);
    customerRepository.findOne.mockResolvedValue(customer);
    accountRepository.create.mockReturnValue(createdAccount);
    accountRepository.save.mockResolvedValue(createdAccount);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await service.create(input as any);

    expect(result).toEqual(createdAccount);
    expect(accountRepository.findOne).toHaveBeenCalledWith({
      where: { accountNumber: input.accountNumber },
    });
    expect(customerRepository.findOne).toHaveBeenCalledWith({
      where: { id: input.customerId },
    });
    expect(accountRepository.create).toHaveBeenCalledWith({
      accountNumber: input.accountNumber,
      currency: input.currency,
      status: AccountStatus.ACTIVE,
      balance: 0,
      customer,
    });
    expect(accountRepository.save).toHaveBeenCalledWith(createdAccount);
  });

  it('should throw ConflictException if account number already exists', async () => {
    const input = {
      accountNumber: 'ACC-1001',
      currency: 'DOP',
      customerId: 'customer-1',
    };

    accountRepository.findOne.mockResolvedValue({
      id: 'existing-account',
      accountNumber: input.accountNumber,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.create(input as any)).rejects.toThrow(
      ConflictException,
    );

    expect(customerRepository.findOne).not.toHaveBeenCalled();
    expect(accountRepository.create).not.toHaveBeenCalled();
    expect(accountRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if customer does not exist', async () => {
    const input = {
      accountNumber: 'ACC-1001',
      currency: 'DOP',
      customerId: 'missing-customer',
    };

    accountRepository.findOne.mockResolvedValue(null);
    customerRepository.findOne.mockResolvedValue(null);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await expect(service.create(input as any)).rejects.toThrow(
      NotFoundException,
    );

    expect(accountRepository.create).not.toHaveBeenCalled();
    expect(accountRepository.save).not.toHaveBeenCalled();
  });

  it('should return all accounts', async () => {
    const accounts = [
      { id: '1', accountNumber: 'ACC-1001' },
      { id: '2', accountNumber: 'ACC-1002' },
    ];

    accountRepository.find.mockResolvedValue(accounts);

    const result = await service.findAll();

    expect(result).toEqual(accounts);
    expect(accountRepository.find).toHaveBeenCalledWith({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  });

  it('should return one account by id', async () => {
    const account = {
      id: 'account-1',
      accountNumber: 'ACC-1001',
      customer: { id: 'customer-1' },
    };

    accountRepository.findOne.mockResolvedValue(account);

    const result = await service.findOne('account-1');

    expect(result).toEqual(account);
    expect(accountRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'account-1' },
      relations: ['customer'],
    });
  });

  it('should throw NotFoundException when account is not found', async () => {
    accountRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-account')).rejects.toThrow(
      NotFoundException,
    );
  });
});

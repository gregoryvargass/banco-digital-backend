import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
  // Inject,
} from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountInput } from '../dto/create-account.input';
import { Customer } from '../../customers/entities/customer.entity';
import { AccountStatus } from '../../../common/enums/account-status.enum';
// import { CACHE_KEYS } from '../../../common/constants/cache-keys';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    // Redis cache temporarily disabled until local Redis is available
    // @Inject(CACHE_MANAGER)
    // private readonly cacheManager: Cache,
  ) {}

  async create(createAccountInput: CreateAccountInput): Promise<Account> {
    this.logger.log(
      `[Account Create] Requested -> accountNumber=${createAccountInput.accountNumber}, customerId=${createAccountInput.customerId}, currency=${createAccountInput.currency}`,
    );

    const existingAccount = await this.accountRepository.findOne({
      where: { accountNumber: createAccountInput.accountNumber },
    });

    if (existingAccount) {
      this.logger.warn(
        `[Account Create] Rejected -> accountNumber=${createAccountInput.accountNumber}, reason=Account number already exists`,
      );
      // eslint-disable-next-line prettier/prettier
      throw new ConflictException('An account with this number already exists.');
    }

    const customer = await this.customerRepository.findOne({
      where: { id: createAccountInput.customerId },
    });

    if (!customer) {
      this.logger.warn(
        `[Account Create] Rejected -> customerId=${createAccountInput.customerId}, reason=Customer not found`,
      );
      throw new NotFoundException('Customer not found.');
    }

    const account = this.accountRepository.create({
      accountNumber: createAccountInput.accountNumber,
      currency: createAccountInput.currency,
      status: AccountStatus.ACTIVE,
      balance: 0,
      customer,
    });

    const savedAccount = await this.accountRepository.save(account);

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.del(CACHE_KEYS.ACCOUNTS_ALL);
    // await this.cacheManager.del(CACHE_KEYS.ACCOUNT_BY_ID(savedAccount.id));

    this.logger.log(
      `[Account Create] Completed -> accountId=${savedAccount.id}, accountNumber=${savedAccount.accountNumber}, customerId=${customer.id}, currency=${savedAccount.currency}, status=${savedAccount.status}`,
    );

    return savedAccount;
  }

  async findAll(): Promise<Account[]> {
    this.logger.log('[Accounts] Fetch all requested');

    // Redis cache temporarily disabled until local Redis is available
    // const cacheKey = CACHE_KEYS.ACCOUNTS_ALL;
    // const cachedAccounts = await this.cacheManager.get<Account[]>(cacheKey);

    // if (cachedAccounts) {
    //   this.logger.log('[Accounts] Cache hit -> accounts:all');
    //   return cachedAccounts;
    // }

    // this.logger.log('[Accounts] Cache miss -> accounts:all');

    const accounts = await this.accountRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.set(cacheKey, accounts, 60_000);

    return accounts;
  }

  async findOne(id: string): Promise<Account> {
    this.logger.log(`[Accounts] Fetch one requested -> accountId=${id}`);

    // Redis cache temporarily disabled until local Redis is available
    // const cacheKey = CACHE_KEYS.ACCOUNT_BY_ID(id);
    // const cachedAccount = await this.cacheManager.get<Account>(cacheKey);

    // if (cachedAccount) {
    //   this.logger.log(`[Accounts] Cache hit -> accountId=${id}`);
    //   return cachedAccount;
    // }

    // this.logger.log(`[Accounts] Cache miss -> accountId=${id}`);

    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!account) {
      this.logger.warn(
        `[Accounts] Fetch one failed -> accountId=${id}, reason=Account not found`,
      );
      throw new NotFoundException('Account not found.');
    }

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.set(cacheKey, account, 60_000);

    return account;
  }
}

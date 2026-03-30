import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountInput } from '../dto/create-account.input';
import { Customer } from '../../customers/entities/customer.entity';
import { AccountStatus } from '../../../common/enums/account-status.enum';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createAccountInput: CreateAccountInput): Promise<Account> {
    const existingAccount = await this.accountRepository.findOne({
      where: { accountNumber: createAccountInput.accountNumber },
    });

    if (existingAccount) {
      // eslint-disable-next-line prettier/prettier
      throw new ConflictException('An account with this number already exists.');
    }

    const customer = await this.customerRepository.findOne({
      where: { id: createAccountInput.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const account = this.accountRepository.create({
      accountNumber: createAccountInput.accountNumber,
      currency: createAccountInput.currency,
      status: AccountStatus.ACTIVE,
      balance: 0,
      customer,
    });

    return await this.accountRepository.save(account);
  }

  async findAll(): Promise<Account[]> {
    return await this.accountRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    return account;
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Account } from '../../accounts/entities/account.entity';
import { DepositInput } from '../dto/deposit.input';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { TransactionStatus } from '../../../common/enums/transaction-status.enum';
import { AccountStatus } from '../../../common/enums/account-status.enum';
import { WithdrawInput } from '../dto/withdraw.input';
import { TransferInput } from '../dto/transfer.input';
import { ExchangeRate } from '../../exchange-rates/entities/exchange-rate.entity';
import { PaginationInput } from 'src/common/dto/pagination.input';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,

    private readonly dataSource: DataSource,
  ) {}

  async deposit(depositInput: DepositInput): Promise<Transaction> {
    const { accountId, amount, description } = depositInput;

    return await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { id: accountId },
        relations: ['customer'],
      });

      if (!account) {
        throw new NotFoundException('Account not found.');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        // eslint-disable-next-line prettier/prettier
        throw new BadRequestException('Only active accounts can receive deposits.');
      }

      account.balance = Number(account.balance) + amount;
      await manager.save(Account, account);

      const transaction = manager.create(Transaction, {
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount,
        currency: account.currency,
        description,
        destinationAccount: account,
        reference: `DEP-${Date.now()}`,
      });

      return await manager.save(Transaction, transaction);
    });
  }

  async withdraw(withdrawInput: WithdrawInput): Promise<Transaction> {
    const { accountId, amount, description } = withdrawInput;

    return await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { id: accountId },
      });

      if (!account) {
        throw new NotFoundException('Account not found.');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Only active accounts can withdraw.');
      }

      if (Number(account.balance) < amount) {
        throw new BadRequestException('Insufficient funds.');
      }

      account.balance = Number(account.balance) - amount;
      await manager.save(Account, account);

      const transaction = manager.create(Transaction, {
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        amount,
        currency: account.currency,
        description,
        sourceAccount: account,
        reference: `WDR-${Date.now()}`,
      });

      return await manager.save(Transaction, transaction);
    });
  }

  async transfer(transferInput: TransferInput): Promise<Transaction> {
    const { sourceAccountId, destinationAccountId, amount, description } =
      transferInput;

    return await this.dataSource.transaction(async (manager) => {
      if (sourceAccountId === destinationAccountId) {
        throw new BadRequestException(
          'Source and destination accounts must be different.',
        );
      }

      const sourceAccount = await manager.findOne(Account, {
        where: { id: sourceAccountId },
      });

      if (!sourceAccount) {
        throw new NotFoundException('Source account not found.');
      }

      const destinationAccount = await manager.findOne(Account, {
        where: { id: destinationAccountId },
      });

      if (!destinationAccount) {
        throw new NotFoundException('Destination account not found.');
      }

      if (sourceAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Source account is not active.');
      }

      if (destinationAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Destination account is not active.');
      }

      let convertedAmount = amount;

      if (sourceAccount.currency !== destinationAccount.currency) {
        const exchangeRate = await manager.findOne(ExchangeRate, {
          where: {
            fromCurrency: sourceAccount.currency,
            toCurrency: destinationAccount.currency,
          },
        });

        if (!exchangeRate) {
          throw new NotFoundException(
            `Exchange rate not found for ${sourceAccount.currency} to ${destinationAccount.currency}.`,
          );
        }
        convertedAmount = Number(amount) * Number(exchangeRate.rate);
      }

      if (Number(sourceAccount.balance) < amount) {
        throw new BadRequestException('Insufficient funds.');
      }

      sourceAccount.balance = Number(sourceAccount.balance) - amount;
      destinationAccount.balance =
        Number(destinationAccount.balance) + convertedAmount;

      await manager.save(Account, sourceAccount);
      await manager.save(Account, destinationAccount);

      const transaction = manager.create(Transaction, {
        type: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        amount,
        currency: sourceAccount.currency,
        description:
          sourceAccount.currency === destinationAccount.currency
            ? description
            : `${description || ''} (converted to ${destinationAccount.currency})`,
        sourceAccount,
        destinationAccount,
        reference: `TRF-${Date.now()}`,
      });

      return await manager.save(Transaction, transaction);
    });
  }

  async findAll(pagination?: PaginationInput): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      take: pagination?.limit || 10,
      skip: pagination?.offset || 0,
      order: { createdAt: 'DESC' },
      relations: ['sourceAccount', 'destinationAccount'],
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['sourceAccount', 'destinationAccount'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found.');
    }

    return transaction;
  }
}

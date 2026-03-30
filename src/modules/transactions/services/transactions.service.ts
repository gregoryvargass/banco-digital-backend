import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  // Inject,
} from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import type { Cache } from 'cache-manager';
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
// import { CACHE_KEYS } from '../../../common/constants/cache-keys';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,

    // Redis cache temporarily disabled until local Redis is available
    // @Inject(CACHE_MANAGER)
    // private readonly cacheManager: Cache,

    private readonly dataSource: DataSource,
  ) {}

  async deposit(depositInput: DepositInput): Promise<Transaction> {
    const { accountId, amount, description } = depositInput;

    this.logger.log(
      `[Deposit] Requested -> accountId=${accountId}, amount=${amount}, description="${description ?? ''}"`,
    );

    return await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { id: accountId },
        relations: ['customer'],
      });

      if (!account) {
        this.logger.warn(
          `[Deposit] Rejected -> accountId=${accountId}, reason=Account not found`,
        );
        throw new NotFoundException('Account not found.');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        this.logger.warn(
          `[Deposit] Rejected -> accountId=${accountId}, status=${account.status}, reason=Account is not active`,
        );
        throw new BadRequestException(
          'Only active accounts can receive deposits.',
        );
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

      const savedTransaction = await manager.save(Transaction, transaction);

      // Redis cache temporarily disabled until local Redis is available
      // await this.cacheManager.del(CACHE_KEYS.ACCOUNTS_ALL);
      // await this.cacheManager.del(CACHE_KEYS.ACCOUNT_BY_ID(accountId));

      this.logger.log(
        `[Deposit] Completed -> transactionId=${savedTransaction.id}, accountId=${accountId}, amount=${amount}, currency=${account.currency}, newBalance=${account.balance}`,
      );

      return savedTransaction;
    });
  }

  async withdraw(withdrawInput: WithdrawInput): Promise<Transaction> {
    const { accountId, amount, description } = withdrawInput;

    this.logger.log(
      `[Withdraw] Requested -> accountId=${accountId}, amount=${amount}, description="${description ?? ''}"`,
    );

    return await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(Account, {
        where: { id: accountId },
      });

      if (!account) {
        this.logger.warn(
          `[Withdraw] Rejected -> accountId=${accountId}, reason=Account not found`,
        );
        throw new NotFoundException('Account not found.');
      }

      if (account.status !== AccountStatus.ACTIVE) {
        this.logger.warn(
          `[Withdraw] Rejected -> accountId=${accountId}, status=${account.status}, reason=Account is not active`,
        );
        throw new BadRequestException('Only active accounts can withdraw.');
      }

      if (Number(account.balance) < amount) {
        this.logger.warn(
          `[Withdraw] Rejected -> accountId=${accountId}, amount=${amount}, balance=${account.balance}, reason=Insufficient funds`,
        );
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

      const savedTransaction = await manager.save(Transaction, transaction);

      // Redis cache temporarily disabled until local Redis is available
      // await this.cacheManager.del(CACHE_KEYS.ACCOUNTS_ALL);
      // await this.cacheManager.del(CACHE_KEYS.ACCOUNT_BY_ID(accountId));

      this.logger.log(
        `[Withdraw] Completed -> transactionId=${savedTransaction.id}, accountId=${accountId}, amount=${amount}, currency=${account.currency}, newBalance=${account.balance}`,
      );

      return savedTransaction;
    });
  }

  async transfer(transferInput: TransferInput): Promise<Transaction> {
    const { sourceAccountId, destinationAccountId, amount, description } =
      transferInput;

    this.logger.log(
      `[Transfer] Requested -> sourceAccountId=${sourceAccountId}, destinationAccountId=${destinationAccountId}, amount=${amount}, description="${description ?? ''}"`,
    );

    return await this.dataSource.transaction(async (manager) => {
      if (sourceAccountId === destinationAccountId) {
        this.logger.warn(
          `[Transfer] Rejected -> sourceAccountId=${sourceAccountId}, destinationAccountId=${destinationAccountId}, reason=Same account`,
        );
        throw new BadRequestException(
          'Source and destination accounts must be different.',
        );
      }

      const sourceAccount = await manager.findOne(Account, {
        where: { id: sourceAccountId },
      });

      if (!sourceAccount) {
        this.logger.warn(
          `[Transfer] Rejected -> sourceAccountId=${sourceAccountId}, reason=Source account not found`,
        );
        throw new NotFoundException('Source account not found.');
      }

      const destinationAccount = await manager.findOne(Account, {
        where: { id: destinationAccountId },
      });

      if (!destinationAccount) {
        this.logger.warn(
          `[Transfer] Rejected -> destinationAccountId=${destinationAccountId}, reason=Destination account not found`,
        );
        throw new NotFoundException('Destination account not found.');
      }

      if (sourceAccount.status !== AccountStatus.ACTIVE) {
        this.logger.warn(
          `[Transfer] Rejected -> sourceAccountId=${sourceAccountId}, status=${sourceAccount.status}, reason=Source account is not active`,
        );
        throw new BadRequestException('Source account is not active.');
      }

      if (destinationAccount.status !== AccountStatus.ACTIVE) {
        this.logger.warn(
          `[Transfer] Rejected -> destinationAccountId=${destinationAccountId}, status=${destinationAccount.status}, reason=Destination account is not active`,
        );
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
          this.logger.warn(
            `[Transfer] Rejected -> sourceCurrency=${sourceAccount.currency}, destinationCurrency=${destinationAccount.currency}, reason=Exchange rate not found`,
          );
          throw new NotFoundException(
            `Exchange rate not found for ${sourceAccount.currency} to ${destinationAccount.currency}.`,
          );
        }

        convertedAmount = Number(amount) * Number(exchangeRate.rate);

        this.logger.log(
          `[Transfer] Conversion applied -> from=${sourceAccount.currency}, to=${destinationAccount.currency}, rate=${exchangeRate.rate}, originalAmount=${amount}, convertedAmount=${convertedAmount}`,
        );
      }

      if (Number(sourceAccount.balance) < amount) {
        this.logger.warn(
          `[Transfer] Rejected -> sourceAccountId=${sourceAccountId}, amount=${amount}, balance=${sourceAccount.balance}, reason=Insufficient funds`,
        );
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

      const savedTransaction = await manager.save(Transaction, transaction);

      // Redis cache temporarily disabled until local Redis is available
      // await this.cacheManager.del(CACHE_KEYS.ACCOUNTS_ALL);
      // await this.cacheManager.del(CACHE_KEYS.ACCOUNT_BY_ID(sourceAccountId));
      // await this.cacheManager.del(CACHE_KEYS.ACCOUNT_BY_ID(destinationAccountId));

      this.logger.log(
        `[Transfer] Completed -> transactionId=${savedTransaction.id}, sourceAccountId=${sourceAccountId}, destinationAccountId=${destinationAccountId}, amount=${amount}, sourceCurrency=${sourceAccount.currency}, destinationCurrency=${destinationAccount.currency}, sourceBalance=${sourceAccount.balance}, destinationBalance=${destinationAccount.balance}`,
      );

      return savedTransaction;
    });
  }

  async findAll(pagination?: PaginationInput): Promise<Transaction[]> {
    const limit = pagination?.limit || 10;
    const offset = pagination?.offset || 0;

    this.logger.log(
      `[Transactions] Fetch all -> limit=${limit}, offset=${offset}`,
    );

    return await this.transactionRepository.find({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['sourceAccount', 'destinationAccount'],
    });
  }

  async findOne(id: string): Promise<Transaction> {
    this.logger.log(`[Transactions] Fetch one -> transactionId=${id}`);

    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['sourceAccount', 'destinationAccount'],
    });

    if (!transaction) {
      this.logger.warn(
        `[Transactions] Fetch one failed -> transactionId=${id}, reason=Transaction not found`,
      );
      throw new NotFoundException('Transaction not found.');
    }

    return transaction;
  }
}

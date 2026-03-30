import 'dotenv/config';
import dataSource from '../data-source';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Account } from '../modules/accounts/entities/account.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { ExchangeRate } from '../modules/exchange-rates/entities/exchange-rate.entity';
import { Currency } from '../common/enums/currency.enum';
import { AccountStatus } from '../common/enums/account-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { TransactionStatus } from '../common/enums/transaction-status.enum';

async function seed() {
  await dataSource.initialize();

  const customerRepository = dataSource.getRepository(Customer);
  const accountRepository = dataSource.getRepository(Account);
  const transactionRepository = dataSource.getRepository(Transaction);
  const exchangeRateRepository = dataSource.getRepository(ExchangeRate);

  console.log('Cleaning existing seed data...');

  await dataSource.query(
    'TRUNCATE TABLE "transactions" RESTART IDENTITY CASCADE',
  );
  await dataSource.query('TRUNCATE TABLE "accounts" RESTART IDENTITY CASCADE');
  await dataSource.query('TRUNCATE TABLE "customers" RESTART IDENTITY CASCADE');
  await dataSource.query(
    'TRUNCATE TABLE "exchange_rates" RESTART IDENTITY CASCADE',
  );

  console.log('Creating customers...');

  const customer1 = customerRepository.create({
    firstName: 'Greg',
    lastName: 'Vargas',
    email: 'greg.seed@example.com',
    documentNumber: '001-0000001-1',
    isActive: true,
  });

  const customer2 = customerRepository.create({
    firstName: 'Laura',
    lastName: 'Gomez',
    email: 'laura.seed@example.com',
    documentNumber: '001-0000002-2',
    isActive: true,
  });

  await customerRepository.save([customer1, customer2]);

  console.log('Creating accounts...');

  const account1 = accountRepository.create({
    accountNumber: 'ACC-DOP-1001',
    currency: Currency.DOP,
    status: AccountStatus.ACTIVE,
    balance: 15000,
    customer: customer1,
  });

  const account2 = accountRepository.create({
    accountNumber: 'ACC-USD-1002',
    currency: Currency.USD,
    status: AccountStatus.ACTIVE,
    balance: 300,
    customer: customer1,
  });

  const account3 = accountRepository.create({
    accountNumber: 'ACC-DOP-2001',
    currency: Currency.DOP,
    status: AccountStatus.ACTIVE,
    balance: 8000,
    customer: customer2,
  });

  const account4 = accountRepository.create({
    accountNumber: 'ACC-EUR-2002',
    currency: Currency.EUR,
    status: AccountStatus.ACTIVE,
    balance: 120,
    customer: customer2,
  });

  await accountRepository.save([account1, account2, account3, account4]);

  console.log('Creating exchange rates...');

  const rates = exchangeRateRepository.create([
    {
      fromCurrency: Currency.USD,
      toCurrency: Currency.DOP,
      rate: 59.52,
    },
    {
      fromCurrency: Currency.DOP,
      toCurrency: Currency.USD,
      rate: 0.017,
    },
    {
      fromCurrency: Currency.EUR,
      toCurrency: Currency.USD,
      rate: 1.08,
    },
    {
      fromCurrency: Currency.USD,
      toCurrency: Currency.EUR,
      rate: 0.93,
    },
    {
      fromCurrency: Currency.EUR,
      toCurrency: Currency.DOP,
      rate: 63.5,
    },
    {
      fromCurrency: Currency.DOP,
      toCurrency: Currency.EUR,
      rate: 0.0157,
    },
  ]);

  await exchangeRateRepository.save(rates);

  console.log('Creating transactions...');

  const transactions = transactionRepository.create([
    {
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.COMPLETED,
      amount: 5000,
      currency: Currency.DOP,
      description: 'Initial DOP deposit',
      destinationAccount: account1,
      reference: `SEED-DEP-${Date.now()}-1`,
    },
    {
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.COMPLETED,
      amount: 50,
      currency: Currency.USD,
      description: 'Initial USD withdrawal',
      sourceAccount: account2,
      reference: `SEED-WDR-${Date.now()}-2`,
    },
    {
      type: TransactionType.TRANSFER,
      status: TransactionStatus.COMPLETED,
      amount: 2000,
      currency: Currency.DOP,
      description: 'Initial same-currency transfer',
      sourceAccount: account1,
      destinationAccount: account3,
      reference: `SEED-TRF-${Date.now()}-3`,
    },
  ]);

  await transactionRepository.save(transactions);

  console.log('Seed completed successfully.');
  await dataSource.destroy();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Customer } from './modules/customers/entities/customer.entity';
import { Account } from './modules/accounts/entities/account.entity';
import { Transaction } from './modules/transactions/entities/transaction.entity';
import { ExchangeRate } from './modules/exchange-rates/entities/exchange-rate.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Customer, Account, Transaction, ExchangeRate],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

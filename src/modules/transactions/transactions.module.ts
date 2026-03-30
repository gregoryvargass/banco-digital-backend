import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { TransactionsService } from './services/transactions.service';
import { TransactionsResolver } from './resolvers/transactions.resolver';
import { ExchangeRate } from '../exchange-rates/entities/exchange-rate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Account, ExchangeRate])],
  providers: [TransactionsService, TransactionsResolver],
  exports: [TypeOrmModule, TransactionsService],
})
export class TransactionsModule {}

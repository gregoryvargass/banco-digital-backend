import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Customer } from '../customers/entities/customer.entity';
import { AccountsService } from './services/accounts.service';
import { AccountsResolver } from './resolvers/accounts.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Customer])],
  providers: [AccountsService, AccountsResolver],
  exports: [TypeOrmModule, AccountsService],
})
export class AccountsModule {}

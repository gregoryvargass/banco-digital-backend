import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Transaction } from '../entities/transaction.entity';
import { TransactionsService } from '../services/transactions.service';
import { DepositInput } from '../dto/deposit.input';
import { WithdrawInput } from '../dto/withdraw.input';
import { TransferInput } from '../dto/transfer.input';
import { PaginationInput } from '../../../common/dto/pagination.input';

@Resolver(() => Transaction)
export class TransactionsResolver {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Mutation(() => Transaction)
  async deposit(
    @Args('depositInput') depositInput: DepositInput,
  ): Promise<Transaction> {
    return await this.transactionsService.deposit(depositInput);
  }

  @Mutation(() => Transaction)
  async withdraw(
    @Args('withdrawInput') withdrawInput: WithdrawInput,
  ): Promise<Transaction> {
    return await this.transactionsService.withdraw(withdrawInput);
  }

  @Mutation(() => Transaction)
  async transfer(
    @Args('transferInput') transferInput: TransferInput,
  ): Promise<Transaction> {
    return await this.transactionsService.transfer(transferInput);
  }

  @Query(() => [Transaction], { name: 'transactions' })
  async findAllTransactions(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<Transaction[]> {
    return await this.transactionsService.findAll(pagination);
  }

  @Query(() => Transaction, { name: 'transaction' })
  async findTransactionById(@Args('id') id: string): Promise<Transaction> {
    return await this.transactionsService.findOne(id);
  }
}

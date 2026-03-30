import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Account } from '../entities/account.entity';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountInput } from '../dto/create-account.input';

@Resolver(() => Account)
export class AccountsResolver {
  constructor(private readonly accountsService: AccountsService) {}

  @Mutation(() => Account)
  async createAccount(
    @Args('createAccountInput') createAccountInput: CreateAccountInput,
  ): Promise<Account> {
    return await this.accountsService.create(createAccountInput);
  }

  @Query(() => [Account], { name: 'accounts' })
  async findAllAccounts(): Promise<Account[]> {
    return await this.accountsService.findAll();
  }

  @Query(() => Account, { name: 'account' })
  async findAccountById(@Args('id') id: string): Promise<Account> {
    return await this.accountsService.findOne(id);
  }
}

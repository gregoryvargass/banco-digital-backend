import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ElasticsearchService } from '../../../elasticsearch/elasticsearch.service';
import { Customer } from '../entities/customer.entity';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerInput } from '../dto/create-customer.input';
import { CustomerSearchResult } from '../entities/customer-search-result.entity';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(
    private readonly customersService: CustomersService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  @Mutation(() => Customer)
  async createCustomer(
    @Args('createCustomerInput') createCustomerInput: CreateCustomerInput,
  ): Promise<Customer> {
    return await this.customersService.create(createCustomerInput);
  }

  @Mutation(() => Boolean)
  async syncCustomersToSearch(): Promise<boolean> {
    return this.customersService.syncCustomersToSearch();
  }

  @Query(() => [CustomerSearchResult], { name: 'searchCustomers' })
  async searchCustomers(
    @Args('term', { type: () => String }) term: string,
  ): Promise<CustomerSearchResult[]> {
    return this.elasticsearchService.searchCustomers(term);
  }

  @Query(() => [Customer], { name: 'customers' })
  async findAllCustomers(): Promise<Customer[]> {
    return await this.customersService.findAll();
  }

  @Query(() => Customer, { name: 'customer' })
  async findCustomerById(@Args('id') id: string): Promise<Customer> {
    return await this.customersService.findOne(id);
  }
}

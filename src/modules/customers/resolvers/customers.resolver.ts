import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Customer } from '../entities/customer.entity';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerInput } from '../dto/create-customer.input';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(private readonly customersService: CustomersService) {}

  @Mutation(() => Customer)
  async createCustomer(
    @Args('createCustomerInput') createCustomerInput: CreateCustomerInput,
  ): Promise<Customer> {
    return await this.customersService.create(createCustomerInput);
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

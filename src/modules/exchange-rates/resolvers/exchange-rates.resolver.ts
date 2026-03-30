import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { ExchangeRatesService } from '../services/exchange-rates.service';
import { CreateExchangeRateInput } from '../dto/create-exchange-rate.input';

@Resolver(() => ExchangeRate)
export class ExchangeRatesResolver {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Mutation(() => ExchangeRate)
  async createExchangeRate(
    @Args('createExchangeRateInput')
    createExchangeRateInput: CreateExchangeRateInput,
  ): Promise<ExchangeRate> {
    return await this.exchangeRatesService.create(createExchangeRateInput);
  }

  @Query(() => [ExchangeRate], { name: 'exchangeRates' })
  async findAllExchangeRates(): Promise<ExchangeRate[]> {
    return await this.exchangeRatesService.findAll();
  }

  @Query(() => ExchangeRate, { name: 'exchangeRate' })
  async findExchangeRateById(@Args('id') id: string): Promise<ExchangeRate> {
    return await this.exchangeRatesService.findOne(id);
  }
}

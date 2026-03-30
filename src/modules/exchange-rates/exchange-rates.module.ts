import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { ExchangeRatesService } from './services/exchange-rates.service';
import { ExchangeRatesResolver } from './resolvers/exchange-rates.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  providers: [ExchangeRatesService, ExchangeRatesResolver],
  exports: [TypeOrmModule, ExchangeRatesService],
})
export class ExchangeRatesModule {}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { CreateExchangeRateInput } from '../dto/create-exchange-rate.input';
import { Currency } from '../../../common/enums/currency.enum';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  async create(
    createExchangeRateInput: CreateExchangeRateInput,
  ): Promise<ExchangeRate> {
    const { fromCurrency, toCurrency, rate } = createExchangeRateInput;

    if (fromCurrency === toCurrency) {
      throw new BadRequestException(
        'Source and target currencies must be different.',
      );
    }

    const existingRate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrency,
        toCurrency,
      },
    });

    if (existingRate) {
      throw new ConflictException(
        'An exchange rate for this currency pair already exists.',
      );
    }

    const exchangeRate = this.exchangeRateRepository.create({
      fromCurrency,
      toCurrency,
      rate,
    });

    return await this.exchangeRateRepository.save(exchangeRate);
  }

  async findAll(): Promise<ExchangeRate[]> {
    return await this.exchangeRateRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<ExchangeRate> {
    const exchangeRate = await this.exchangeRateRepository.findOne({
      where: { id },
    });

    if (!exchangeRate) {
      throw new NotFoundException('Exchange rate not found.');
    }

    return exchangeRate;
  }

  async findRateOrFail(
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Promise<ExchangeRate> {
    const exchangeRate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrency,
        toCurrency,
      },
    });

    if (!exchangeRate) {
      throw new NotFoundException(
        `Exchange rate not found for ${fromCurrency} to ${toCurrency}.`,
      );
    }

    return exchangeRate;
  }
}

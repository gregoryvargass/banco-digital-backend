import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
  // Inject,
} from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { CreateExchangeRateInput } from '../dto/create-exchange-rate.input';
import { Currency } from '../../../common/enums/currency.enum';
// import { CACHE_KEYS } from '../../../common/constants/cache-keys';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,

    // Redis cache temporarily disabled until local Redis is available
    // @Inject(CACHE_MANAGER)
    // private readonly cacheManager: Cache,
  ) {}

  async create(
    createExchangeRateInput: CreateExchangeRateInput,
  ): Promise<ExchangeRate> {
    const { fromCurrency, toCurrency, rate } = createExchangeRateInput;

    this.logger.log(
      `[Exchange Rate Create] Requested -> from=${fromCurrency}, to=${toCurrency}, rate=${rate}`,
    );

    if (fromCurrency === toCurrency) {
      this.logger.warn(
        `[Exchange Rate Create] Rejected -> from=${fromCurrency}, to=${toCurrency}, reason=Same currency pair`,
      );
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
      this.logger.warn(
        `[Exchange Rate Create] Rejected -> from=${fromCurrency}, to=${toCurrency}, reason=Currency pair already exists`,
      );
      throw new ConflictException(
        'An exchange rate for this currency pair already exists.',
      );
    }

    const exchangeRate = this.exchangeRateRepository.create({
      fromCurrency,
      toCurrency,
      rate,
    });

    const savedExchangeRate =
      await this.exchangeRateRepository.save(exchangeRate);

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.del(CACHE_KEYS.EXCHANGE_RATES_ALL);
    // await this.cacheManager.del(
    //   CACHE_KEYS.EXCHANGE_RATE_PAIR(fromCurrency, toCurrency),
    // );

    this.logger.log(
      `[Exchange Rate Create] Completed -> exchangeRateId=${savedExchangeRate.id}, from=${savedExchangeRate.fromCurrency}, to=${savedExchangeRate.toCurrency}, rate=${savedExchangeRate.rate}`,
    );

    return savedExchangeRate;
  }

  async findAll(): Promise<ExchangeRate[]> {
    this.logger.log('[Exchange Rates] Fetch all requested');

    // Redis cache temporarily disabled until local Redis is available
    // const cacheKey = CACHE_KEYS.EXCHANGE_RATES_ALL;
    // const cachedRates = await this.cacheManager.get<ExchangeRate[]>(cacheKey);

    // if (cachedRates) {
    //   this.logger.log('[Exchange Rates] Cache hit -> exchange-rates:all');
    //   return cachedRates;
    // }

    // this.logger.log('[Exchange Rates] Cache miss -> exchange-rates:all');

    const rates = await this.exchangeRateRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.set(cacheKey, rates, 60_000);

    return rates;
  }

  async findOne(id: string): Promise<ExchangeRate> {
    this.logger.log(
      `[Exchange Rates] Fetch one requested -> exchangeRateId=${id}`,
    );

    const exchangeRate = await this.exchangeRateRepository.findOne({
      where: { id },
    });

    if (!exchangeRate) {
      this.logger.warn(
        `[Exchange Rates] Fetch one failed -> exchangeRateId=${id}, reason=Exchange rate not found`,
      );
      throw new NotFoundException('Exchange rate not found.');
    }

    return exchangeRate;
  }

  async findRateOrFail(
    fromCurrency: Currency,
    toCurrency: Currency,
  ): Promise<ExchangeRate> {
    this.logger.log(
      `[Exchange Rates] Fetch pair requested -> from=${fromCurrency}, to=${toCurrency}`,
    );

    // Redis cache temporarily disabled until local Redis is available
    // const cacheKey = CACHE_KEYS.EXCHANGE_RATE_PAIR(fromCurrency, toCurrency);
    // const cachedRate = await this.cacheManager.get<ExchangeRate>(cacheKey);

    // if (cachedRate) {
    //   this.logger.log(
    //     `[Exchange Rates] Cache hit -> from=${fromCurrency}, to=${toCurrency}`,
    //   );
    //   return cachedRate;
    // }

    // this.logger.log(
    //   `[Exchange Rates] Cache miss -> from=${fromCurrency}, to=${toCurrency}`,
    // );

    const exchangeRate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrency,
        toCurrency,
      },
    });

    if (!exchangeRate) {
      this.logger.warn(
        `[Exchange Rates] Fetch pair failed -> from=${fromCurrency}, to=${toCurrency}, reason=Exchange rate not found`,
      );
      throw new NotFoundException(
        `Exchange rate not found for ${fromCurrency} to ${toCurrency}.`,
      );
    }

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.set(cacheKey, exchangeRate, 60_000);

    return exchangeRate;
  }
}

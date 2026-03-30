/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExchangeRate } from '../entities/exchange-rate.entity';
import { ExchangeRatesService } from './exchange-rates.service';

describe('ExchangeRatesService', () => {
  let service: ExchangeRatesService;

  let exchangeRateRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    exchangeRateRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRatesService,
        {
          provide: getRepositoryToken(ExchangeRate),
          useValue: exchangeRateRepository,
        },
      ],
    }).compile();

    service = module.get<ExchangeRatesService>(ExchangeRatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an exchange rate successfully', async () => {
    const input = {
      fromCurrency: 'USD',
      toCurrency: 'DOP',
      rate: 58.8,
    };

    const createdRate = {
      id: 'rate-1',
      ...input,
    };

    exchangeRateRepository.findOne.mockResolvedValue(null);
    exchangeRateRepository.create.mockReturnValue(createdRate);
    exchangeRateRepository.save.mockResolvedValue(createdRate);

    const result = await service.create(input as any);

    expect(result).toEqual(createdRate);
    expect(exchangeRateRepository.findOne).toHaveBeenCalledWith({
      where: {
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
      },
    });
    expect(exchangeRateRepository.create).toHaveBeenCalledWith(input);
    expect(exchangeRateRepository.save).toHaveBeenCalledWith(createdRate);
  });

  it('should throw BadRequestException if source and target currencies are the same', async () => {
    const input = {
      fromCurrency: 'USD',
      toCurrency: 'USD',
      rate: 1,
    };

    await expect(service.create(input as any)).rejects.toThrow(
      BadRequestException,
    );

    expect(exchangeRateRepository.findOne).not.toHaveBeenCalled();
    expect(exchangeRateRepository.create).not.toHaveBeenCalled();
    expect(exchangeRateRepository.save).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if exchange rate pair already exists', async () => {
    const input = {
      fromCurrency: 'USD',
      toCurrency: 'DOP',
      rate: 58.8,
    };

    exchangeRateRepository.findOne.mockResolvedValue({
      id: 'existing-rate',
      fromCurrency: 'USD',
      toCurrency: 'DOP',
      rate: 58.5,
    });

    await expect(service.create(input as any)).rejects.toThrow(
      ConflictException,
    );

    expect(exchangeRateRepository.create).not.toHaveBeenCalled();
    expect(exchangeRateRepository.save).not.toHaveBeenCalled();
  });

  it('should return all exchange rates', async () => {
    const rates = [
      { id: '1', fromCurrency: 'USD', toCurrency: 'DOP', rate: 58.8 },
      { id: '2', fromCurrency: 'EUR', toCurrency: 'DOP', rate: 63.1 },
    ];

    exchangeRateRepository.find.mockResolvedValue(rates);

    const result = await service.findAll();

    expect(result).toEqual(rates);
    expect(exchangeRateRepository.find).toHaveBeenCalledWith({
      order: {
        createdAt: 'DESC',
      },
    });
  });

  it('should return one exchange rate by id', async () => {
    const rate = {
      id: 'rate-1',
      fromCurrency: 'USD',
      toCurrency: 'DOP',
      rate: 58.8,
    };

    exchangeRateRepository.findOne.mockResolvedValue(rate);

    const result = await service.findOne('rate-1');

    expect(result).toEqual(rate);
    expect(exchangeRateRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'rate-1' },
    });
  });

  it('should throw NotFoundException when exchange rate is not found by id', async () => {
    exchangeRateRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-rate')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return exchange rate by currency pair', async () => {
    const rate = {
      id: 'rate-1',
      fromCurrency: 'USD',
      toCurrency: 'DOP',
      rate: 58.8,
    };

    exchangeRateRepository.findOne.mockResolvedValue(rate);

    const result = await service.findRateOrFail('USD' as any, 'DOP' as any);

    expect(result).toEqual(rate);
    expect(exchangeRateRepository.findOne).toHaveBeenCalledWith({
      where: {
        fromCurrency: 'USD',
        toCurrency: 'DOP',
      },
    });
  });

  it('should throw NotFoundException when exchange rate pair is not found', async () => {
    exchangeRateRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findRateOrFail('USD' as any, 'EUR' as any),
    ).rejects.toThrow(NotFoundException);
  });
});

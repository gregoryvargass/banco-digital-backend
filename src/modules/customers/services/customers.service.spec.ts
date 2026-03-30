/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;

  let customerRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    customerRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a customer successfully', async () => {
    const input = {
      firstName: 'Diego',
      lastName: 'Vargas',
      email: 'diego@example.com',
      documentNumber: '001-1234567-8',
    };

    const createdCustomer = {
      id: 'customer-1',
      ...input,
    };

    customerRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    customerRepository.create.mockReturnValue(createdCustomer);
    customerRepository.save.mockResolvedValue(createdCustomer);

    const result = await service.create(input as any);

    expect(result).toEqual(createdCustomer);
    expect(customerRepository.findOne).toHaveBeenCalledTimes(2);
    expect(customerRepository.create).toHaveBeenCalledWith(input);
    expect(customerRepository.save).toHaveBeenCalledWith(createdCustomer);
  });

  it('should throw ConflictException if email already exists', async () => {
    const input = {
      firstName: 'Diego',
      lastName: 'Vargas',
      email: 'diego@example.com',
      documentNumber: '001-1234567-8',
    };

    customerRepository.findOne.mockResolvedValueOnce({
      id: 'existing-customer',
      email: input.email,
    });

    await expect(service.create(input as any)).rejects.toThrow(
      ConflictException,
    );

    expect(customerRepository.create).not.toHaveBeenCalled();
    expect(customerRepository.save).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if document number already exists', async () => {
    const input = {
      firstName: 'Diego',
      lastName: 'Vargas',
      email: 'diego@example.com',
      documentNumber: '001-1234567-8',
    };

    customerRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'existing-customer',
        documentNumber: input.documentNumber,
      });

    await expect(service.create(input as any)).rejects.toThrow(
      ConflictException,
    );

    expect(customerRepository.create).not.toHaveBeenCalled();
    expect(customerRepository.save).not.toHaveBeenCalled();
  });

  it('should return all customers', async () => {
    const customers = [
      { id: '1', email: 'a@test.com' },
      { id: '2', email: 'b@test.com' },
    ];

    customerRepository.find.mockResolvedValue(customers);

    const result = await service.findAll();

    expect(result).toEqual(customers);
    expect(customerRepository.find).toHaveBeenCalledWith({
      relations: ['accounts'],
      order: { createdAt: 'DESC' },
    });
  });

  it('should return one customer by id', async () => {
    const customer = {
      id: 'customer-1',
      email: 'diego@example.com',
      accounts: [],
    };

    customerRepository.findOne.mockResolvedValue(customer);

    const result = await service.findOne('customer-1');

    expect(result).toEqual(customer);
    expect(customerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'customer-1' },
      relations: ['accounts'],
    });
  });

  it('should throw NotFoundException when customer is not found', async () => {
    customerRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-customer-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});

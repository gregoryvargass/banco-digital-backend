import {
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
  // Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerInput } from '../dto/create-customer.input';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import type { Cache } from 'cache-manager';
// import { CACHE_KEYS } from '../../../common/constants/cache-keys';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    // Redis cache temporarily disabled until local Redis is available
    // @Inject(CACHE_MANAGER)
    // private readonly cacheManager: Cache,
  ) {}

  async create(createCustomerInput: CreateCustomerInput): Promise<Customer> {
    this.logger.log(
      `[Customer Create] Requested -> email=${createCustomerInput.email}, documentNumber=${createCustomerInput.documentNumber}`,
    );

    const existingByEmail = await this.customerRepository.findOne({
      where: { email: createCustomerInput.email },
    });

    if (existingByEmail) {
      this.logger.warn(
        `[Customer Create] Rejected -> email=${createCustomerInput.email}, reason=Email already exists`,
      );
      throw new ConflictException('A customer with this email already exists.');
    }

    const existingByDocument = await this.customerRepository.findOne({
      where: { documentNumber: createCustomerInput.documentNumber },
    });

    if (existingByDocument) {
      this.logger.warn(
        `[Customer Create] Rejected -> documentNumber=${createCustomerInput.documentNumber}, reason=Document number already exists`,
      );
      throw new ConflictException(
        'A customer with this document number already exists.',
      );
    }

    const customer = this.customerRepository.create(createCustomerInput);
    const savedCustomer = await this.customerRepository.save(customer);

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.del(CACHE_KEYS.CUSTOMERS_ALL);
    // await this.cacheManager.set(
    //   CACHE_KEYS.CUSTOMER_BY_ID(savedCustomer.id),
    //   savedCustomer,
    //   60_000,
    // );

    this.logger.log(
      `[Customer Create] Completed -> customerId=${savedCustomer.id}, email=${savedCustomer.email}, documentNumber=${savedCustomer.documentNumber}`,
    );

    return savedCustomer;
  }

  async findAll(): Promise<Customer[]> {
    this.logger.log('[Customers] Fetch all requested');

    // Redis cache temporarily disabled until local Redis is available
    // const cacheKey = CACHE_KEYS.CUSTOMERS_ALL;
    // const cachedCustomers = await this.cacheManager.get<Customer[]>(cacheKey);

    // if (cachedCustomers) {
    //   this.logger.log('[Customers] Cache hit -> customers:all');
    //   return cachedCustomers;
    // }

    // this.logger.log('[Customers] Cache miss -> customers:all');

    const customers = await this.customerRepository.find({
      relations: ['accounts'],
      order: { createdAt: 'DESC' },
    });

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.set(cacheKey, customers, 60_000);

    return customers;
  }

  async findOne(id: string): Promise<Customer> {
    this.logger.log(`[Customers] Fetch one requested -> customerId=${id}`);

    // Redis cache temporarily disabled until local Redis is available
    // const cacheKey = CACHE_KEYS.CUSTOMER_BY_ID(id);
    // const cachedCustomer = await this.cacheManager.get<Customer>(cacheKey);

    // if (cachedCustomer) {
    //   this.logger.log(`[Customers] Cache hit -> customerId=${id}`);
    //   return cachedCustomer;
    // }

    // this.logger.log(`[Customers] Cache miss -> customerId=${id}`);

    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['accounts'],
    });

    if (!customer) {
      this.logger.warn(
        `[Customers] Fetch one failed -> customerId=${id}, reason=Customer not found`,
      );
      throw new NotFoundException('Customer not found.');
    }

    // Redis cache temporarily disabled until local Redis is available
    // await this.cacheManager.set(cacheKey, customer, 60_000);

    return customer;
  }
}

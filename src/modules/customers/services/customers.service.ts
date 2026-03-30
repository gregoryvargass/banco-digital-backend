import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerInput } from '../dto/create-customer.input';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerInput: CreateCustomerInput): Promise<Customer> {
    const existingByEmail = await this.customerRepository.findOne({
      where: { email: createCustomerInput.email },
    });

    if (existingByEmail) {
      throw new ConflictException('A customer with this email already exists.');
    }

    const existingByDocument = await this.customerRepository.findOne({
      where: { documentNumber: createCustomerInput.documentNumber },
    });

    if (existingByDocument) {
      // eslint-disable-next-line prettier/prettier
      throw new ConflictException('A customer with this document number already exists.');
    }

    const customer = this.customerRepository.create(createCustomerInput);
    return await this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      relations: ['accounts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['accounts'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }
}

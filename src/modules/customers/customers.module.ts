import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomersService } from './services/customers.service';
import { CustomersResolver } from './resolvers/customers.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersService, CustomersResolver],
  exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}

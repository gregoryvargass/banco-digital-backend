import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomersService } from './services/customers.service';
import { CustomersResolver } from './resolvers/customers.resolver';
import { ElasticsearchModule } from '../../elasticsearch/elasticsearch.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), ElasticsearchModule],
  providers: [CustomersService, CustomersResolver],
  exports: [TypeOrmModule, CustomersService],
})
export class CustomersModule {}

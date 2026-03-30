import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../../common/enums/currency.enum';

registerEnumType(Currency, {
  name: 'Currency',
});

@ObjectType()
@Entity('exchange_rates')
export class ExchangeRate {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Currency)
  @Column({
    type: 'enum',
    enum: Currency,
  })
  fromCurrency: Currency;

  @Field(() => Currency)
  @Column({
    type: 'enum',
    enum: Currency,
  })
  toCurrency: Currency;

  @Field()
  @Column('decimal', { precision: 18, scale: 6 })
  rate: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

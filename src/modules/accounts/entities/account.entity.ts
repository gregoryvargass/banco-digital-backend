import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Currency } from '../../../common/enums/currency.enum';
import { AccountStatus } from '../../../common/enums/account-status.enum';

registerEnumType(Currency, {
  name: 'Currency',
});

registerEnumType(AccountStatus, {
  name: 'AccountStatus',
});

@ObjectType()
@Entity('accounts')
export class Account {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true, length: 20 })
  accountNumber: string;

  @Field(() => Currency)
  @Column({
    type: 'enum',
    enum: Currency,
  })
  currency: Currency;

  @Field(() => AccountStatus)
  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @Field()
  @Column('decimal', { precision: 18, scale: 2, default: 0 })
  balance: number;

  @Field(() => Customer)
  @ManyToOne(() => Customer, (customer) => customer.accounts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  customer: Customer;

  @Field(() => [Transaction], { nullable: true })
  @OneToMany(() => Transaction, (transaction) => transaction.sourceAccount)
  outgoingTransactions?: Transaction[];

  @Field(() => [Transaction], { nullable: true })
  @OneToMany(() => Transaction, (transaction) => transaction.destinationAccount)
  incomingTransactions?: Transaction[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

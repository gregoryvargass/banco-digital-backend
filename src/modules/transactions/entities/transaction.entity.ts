import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Currency } from '../../../common/enums/currency.enum';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { TransactionStatus } from '../../../common/enums/transaction-status.enum';

registerEnumType(TransactionType, {
  name: 'TransactionType',
});

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
});

registerEnumType(Currency, {
  name: 'Currency',
});

@ObjectType()
@Entity('transactions')
export class Transaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => TransactionType)
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Field(() => TransactionStatus)
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Field()
  @Column('decimal', { precision: 18, scale: 2 })
  amount: number;

  @Field(() => Currency)
  @Column({
    type: 'enum',
    enum: Currency,
  })
  currency: Currency;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  description?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, unique: true, length: 100 })
  reference?: string;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.outgoingTransactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  sourceAccount?: Account;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.incomingTransactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  destinationAccount?: Account;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}

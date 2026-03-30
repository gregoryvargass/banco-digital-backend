import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

@ObjectType()
@Entity('customers')
export class Customer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ length: 100 })
  firstName: string;

  @Field()
  @Column({ length: 100 })
  lastName: string;

  @Field()
  @Column({ unique: true, length: 150 })
  email: string;

  @Field()
  @Column({ unique: true, length: 30 })
  documentNumber: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => [Account], { nullable: true })
  @OneToMany(() => Account, (account) => account.customer)
  accounts?: Account[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

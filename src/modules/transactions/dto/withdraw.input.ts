import { Field, InputType } from '@nestjs/graphql';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class WithdrawInput {
  @Field()
  @IsUUID()
  accountId: string;

  @Field()
  @IsNumber()
  @IsPositive()
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

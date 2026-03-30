import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Currency } from '../../../common/enums/currency.enum';

@InputType()
export class CreateAccountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  accountNumber: string;

  @Field(() => Currency)
  @IsEnum(Currency)
  currency: Currency;

  @Field()
  @IsUUID()
  customerId: string;
}

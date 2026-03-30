import { Field, InputType, registerEnumType } from '@nestjs/graphql';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Currency } from '../../../common/enums/currency.enum';

registerEnumType(Currency, {
  name: 'Currency',
});

@InputType()
export class CreateExchangeRateInput {
  @Field(() => Currency)
  @IsEnum(Currency)
  fromCurrency: Currency;

  @Field(() => Currency)
  @IsEnum(Currency)
  toCurrency: Currency;

  @Field()
  @IsNumber()
  @IsPositive()
  rate: number;
}

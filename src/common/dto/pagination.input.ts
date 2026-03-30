import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsPositive } from 'class-validator';

@InputType()
export class PaginationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsPositive()
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsPositive()
  offset?: number;
}

import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CustomerSearchResult {
  @Field()
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  documentNumber: string;

  @Field()
  isActive: boolean;
}

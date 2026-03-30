import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1774838077470 implements MigrationInterface {
    name = 'InitSchema1774838077470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."exchange_rates_fromcurrency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TYPE "public"."exchange_rates_tocurrency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TABLE "exchange_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fromCurrency" "public"."exchange_rates_fromcurrency_enum" NOT NULL, "toCurrency" "public"."exchange_rates_tocurrency_enum" NOT NULL, "rate" numeric(18,6) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_33a614bad9e61956079d817ebe2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "exchange_rates"`);
        await queryRunner.query(`DROP TYPE "public"."exchange_rates_tocurrency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."exchange_rates_fromcurrency_enum"`);
    }

}

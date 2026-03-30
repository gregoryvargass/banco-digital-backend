import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1774832415593 implements MigrationInterface {
    name = 'InitSchema1774832415593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'COMPLETED', "amount" numeric(18,2) NOT NULL, "currency" "public"."transactions_currency_enum" NOT NULL, "description" character varying(255), "reference" character varying(100), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "sourceAccountId" uuid, "destinationAccountId" uuid, CONSTRAINT "UQ_dd85cc865e0c3d5d4be095d3f3f" UNIQUE ("reference"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountNumber" character varying(20) NOT NULL, "currency" "public"."accounts_currency_enum" NOT NULL, "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'ACTIVE', "balance" numeric(18,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" uuid NOT NULL, CONSTRAINT "UQ_c57d6a982eeaa1d115687b17b63" UNIQUE ("accountNumber"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "documentNumber" character varying(30) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8536b8b85c06969f84f0c098b03" UNIQUE ("email"), CONSTRAINT "UQ_dffea8343d90688bccac70b63ad" UNIQUE ("documentNumber"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_c2edf5312a2dff9e7607e4b4a0c" FOREIGN KEY ("sourceAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e704cd38335d6b334f2fce8caf9" FOREIGN KEY ("destinationAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3c8ddd991a3e7cc26517def48ed" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3c8ddd991a3e7cc26517def48ed"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e704cd38335d6b334f2fce8caf9"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c2edf5312a2dff9e7607e4b4a0c"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_currency_enum"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    }

}

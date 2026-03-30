# Banco Digital Backend

Backend for a digital banking system built with NestJS, GraphQL, PostgreSQL, and TypeORM.

This project was developed as a backend technical assessment for a banking scenario involving customers, accounts, transactions, and multi-currency transfers with exchange rates.

---

## Features

- Customer creation and query
- Account creation and query
- Deposits
- Withdrawals
- Transfers between accounts
- Multi-currency transfers using exchange rates
- Exchange rate management
- Pagination for transactions
- Health check endpoint
- Database migrations
- Seed script with demo data

---

## Tech Stack

- NestJS
- TypeScript
- GraphQL
- Apollo Server
- PostgreSQL
- TypeORM
- class-validator / ValidationPipe

---

## Architecture Notes

The project is organized in a modular structure by domain:

- `customers`
- `accounts`
- `transactions`
- `exchange-rates`

Each module contains its own:

- DTOs
- Entities
- Resolvers
- Services

This separation keeps the codebase maintainable and makes it easier to extend business rules over time.

---

## Project Structure

```txt
src/
  common/
    constants/
    dto/
    enums/
    filters/
    interceptors/

  config/

  modules/
    customers/
      dto/
      entities/
      resolvers/
      services/

    accounts/
      dto/
      entities/
      resolvers/
      services/

    transactions/
      dto/
      entities/
      resolvers/
      services/

    exchange-rates/
      dto/
      entities/
      resolvers/
      services/

  health/
  migrations/
  seeds/
  data-source.ts
  app.module.ts
  app.resolver.ts
  main.ts

```

## Requirements

- Node.js 20+
- PostgreSQL running locally
- npm

## Environment Variables

Create a .env file in the project root:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=banco_digital

REDIS_HOST=localhost
REDIS_PORT=6379

ELASTICSEARCH_NODE=http://localhost:9200
```

## Installation

```bash
npm install --legacy-peer-deps
```

## Database Setup

Create the database manually in PostgreSQL:

```bash
CREATE DATABASE banco_digital;
```

## Run Migrations

```bash
npm run migration:run
```

## Seed Demo Data

```bash
npm run seed
```

This inserts:

- demo customers
- demo accounts
- exchange rates
- initial transactions

## Start the Application

```bash
npm run start:dev
```

## Endpoints

GraphQL
http://localhost:3000/graphql

Health Check
http://localhost:3000/health

## Business Rules Implemented

Customers

- email must be unique
- document number must be unique

Accounts

- account number must be unique
- an account must belong to an existing customer
- new accounts start active with a balance of 0

Deposits

- only active accounts can receive deposits
- deposit amount must be positive

Withdrawals

- only active accounts can withdraw
- withdrawal amount must be positive
- insufficient funds are rejected

Transfers

- source and destination accounts must be different
- both accounts must exist
- both accounts must be active
- insufficient funds are rejected
- same-currency transfers are supported
- different-currency transfers are supported through exchange rates
- all balance updates and transaction creation happen inside a database transaction

Exchange Rates

- source and target currencies must be different
- duplicate currency pairs are rejected

Transactional Integrity

Deposits, withdrawals, and transfers are executed using database transactions through DataSource.transaction(...).

This ensures:

- balances are not partially updated
- transaction records and balance changes are committed atomically
- failures roll back safely

## Available Scripts

```bash
npm run start:dev
npm run migration:generate
npm run migration:run
npm run migration:revert
npm run seed
```

## Example GraphQL Operations

Health Check

```graphql
query {
  healthCheck
}
```

Create Customer

```graphql
mutation {
  createCustomer(
    createCustomerInput: {
      firstName: "Diego"
      lastName: "Vargas"
      email: "diego@example.com"
      documentNumber: "001-1234567-8"
    }
  ) {
    id
    firstName
    lastName
    email
    documentNumber
    isActive
  }
}
```

Get Customers

```graphql
query {
  customers {
    id
    firstName
    lastName
    email
    documentNumber
    isActive
  }
}
```

Create Account

```graphql
mutation {
  createAccount(
    createAccountInput: {
      accountNumber: "ACC-1001"
      currency: DOP
      customerId: "CUSTOMER_ID_HERE"
    }
  ) {
    id
    accountNumber
    currency
    status
    balance
  }
}
```

Get Accounts

```graphql
query {
  accounts {
    id
    accountNumber
    currency
    status
    balance
    customer {
      id
      firstName
      email
    }
  }
}
```

Deposit

```graphql
mutation {
  deposit(
    depositInput: {
      accountId: "ACCOUNT_ID_HERE"
      amount: 1500
      description: "Initial deposit"
    }
  ) {
    id
    type
    status
    amount
    currency
    destinationAccount {
      id
      accountNumber
      balance
    }
  }
}
```

Withdraw

```graphql
mutation {
  withdraw(
    withdrawInput: {
      accountId: "ACCOUNT_ID_HERE"
      amount: 200
      description: "Withdrawal test"
    }
  ) {
    id
    type
    status
    amount
    currency
    sourceAccount {
      id
      accountNumber
      balance
    }
  }
}
```

Transfer

```graphql
mutation {
  transfer(
    transferInput: {
      sourceAccountId: "SOURCE_ACCOUNT_ID"
      destinationAccountId: "DESTINATION_ACCOUNT_ID"
      amount: 300
      description: "Transfer test"
    }
  ) {
    id
    type
    status
    amount
    currency
    sourceAccount {
      id
      accountNumber
      balance
    }
    destinationAccount {
      id
      accountNumber
      balance
    }
  }
}
```

Create Exchange Rate

```graphql
mutation {
  createExchangeRate(
    createExchangeRateInput: { fromCurrency: USD, toCurrency: DOP, rate: 58.8 }
  ) {
    id
    fromCurrency
    toCurrency
    rate
  }
}
```

Get Exchange Rates

```graphql
query {
  exchangeRates {
    id
    fromCurrency
    toCurrency
    rate
    createdAt
  }
}
```

Paginated Transactions

```graphql
query {
  transactions(pagination: { limit: 10, offset: 0 }) {
    id
    type
    amount
    currency
    description
    createdAt
  }
}
```

## Seeded Demo Data

Running the seed script inserts demo records for:

- customers
- accounts in DOP, USD, and EUR
- exchange rates
- initial transaction history

This makes the project easier to review and test immediately.

## Notes

- Docker was considered for local infrastructure, but the project runs correctly using a local PostgreSQL installation.
- Redis and ElasticSearch dependencies were included as part of the required stack and can be integrated further in a next iteration.
- Apollo local landing page / sandbox is used to test GraphQL operations.

## Future Improvements

- Redis caching for read-heavy queries
- ElasticSearch integration for search
- structured logs
- automated tests
- role-based authentication
- simple frontend dashboard for demo purposes

---

## Optional Frontend Demo

A simple Next.js demo frontend was also built to showcase the API visually.

Frontend repository:
(https://github.com/gregoryvargass/banco-digital-frontend)

## Author

Greg Vargas


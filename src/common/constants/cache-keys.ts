export const CACHE_KEYS = {
  CUSTOMERS_ALL: 'customers:all',
  CUSTOMER_BY_ID: (id: string) => `customers:${id}`,

  ACCOUNTS_ALL: 'accounts:all',
  ACCOUNT_BY_ID: (id: string) => `accounts:${id}`,

  EXCHANGE_RATES_ALL: 'exchange-rates:all',
  EXCHANGE_RATE_PAIR: (from: string, to: string) =>
    `exchange-rates:${from}:${to}`,
};

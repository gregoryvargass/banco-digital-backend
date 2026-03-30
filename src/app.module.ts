import { Module } from '@nestjs/common';
// import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
// import KeyvRedis from '@keyv/redis';
import { AppResolver } from './app.resolver';
import { CustomersModule } from './modules/customers/customers.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Redis cache temporarily disabled until local Redis is available
    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => {
    //     const host = configService.get<string>('REDIS_HOST') || 'localhost';
    //     const port = configService.get<string>('REDIS_PORT') || '6379';
    //     const redisUrl = `redis://${host}:${port}`;
    //
    //     return {
    //       stores: [new KeyvRedis(redisUrl)],
    //       ttl: 60_000,
    //     };
    //   },
    // }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      introspection: true,
      playground: false,
      csrfPrevention: false,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          embed: true,
        }),
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    CustomersModule,
    AccountsModule,
    TransactionsModule,
    ExchangeRatesModule,
  ],
  providers: [AppResolver],
  controllers: [HealthController],
})
export class AppModule {}

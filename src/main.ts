import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/interceptors/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['log', 'warn', 'error']
      : ['log', 'warn', 'error', 'debug', 'verbose'],
  });

  app.enableCors({
    origin: ['http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  Logger.log(`Application running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(
    `GraphQL available at http://localhost:${port}/graphql`,
    'Bootstrap',
  );
  Logger.log(
    `Health check available at http://localhost:${port}/health`,
    'Bootstrap',
  );
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();

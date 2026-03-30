/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startedAt = Date.now();
    const contextType = context.getType<'http' | 'graphql'>();

    if (contextType === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();

      const operationType = info.operation.operation.toUpperCase();
      const fieldName = info.fieldName;

      this.logger.log(`[GraphQL] ${operationType} ${fieldName} started`);

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startedAt;
          this.logger.log(
            `[GraphQL] ${operationType} ${fieldName} completed in ${duration}ms`,
          );
        }),
        catchError((error: unknown) => {
          const duration = Date.now() - startedAt;
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          const stack = error instanceof Error ? error.stack : undefined;

          this.logger.error(
            `[GraphQL] ${operationType} ${fieldName} failed in ${duration}ms: ${message}`,
            stack,
          );

          return throwError(() => error);
        }),
      );
    }

    const req = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      url?: string;
    }>();

    const method = req.method;
    const url = req.originalUrl || req.url || '';

    this.logger.log(`[HTTP] ${method} ${url} started`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        this.logger.log(`[HTTP] ${method} ${url} completed in ${duration}ms`);
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startedAt;
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `[HTTP] ${method} ${url} failed in ${duration}ms: ${message}`,
          stack,
        );

        return throwError(() => error);
      }),
    );
  }
}

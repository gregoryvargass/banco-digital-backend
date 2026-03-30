/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const type = host.getType<'http' | 'graphql'>();

    if (type === 'graphql') {
      const gqlHost = GqlArgumentsHost.create(host);
      const info = gqlHost.getInfo();

      const message =
        exception instanceof Error
          ? exception.message
          : 'Unknown GraphQL error';

      this.logger.error(
        `[GraphQL] Error in ${info.parentType.name}.${info.fieldName}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );

      throw exception;
    }

    const http = host.switchToHttp();
    const request = http.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        message = (response as { message: string | string[] }).message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[HTTP] ${request.method} ${request.url} -> ${status} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    throw exception;
  }
}

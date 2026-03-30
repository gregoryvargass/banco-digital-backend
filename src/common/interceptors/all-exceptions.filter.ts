/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
        exception instanceof Error ? exception.message : 'Unknown GraphQL error';

      this.logger.error(
        `[GraphQL] Error in ${info.parentType.name}.${info.fieldName}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );

      throw exception;
    }

    const http = host.switchToHttp();
    const request = http.getRequest<{ method: string; url: string }>();
    const response = http.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = (exceptionResponse as { message: string | string[] }).message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (request.url === '/favicon.ico' && status === 404) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Not Found',
      });
    }

    if (status >= 500) {
      this.logger.error(
        `[HTTP] ${request.method} ${request.url} -> ${status} - ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[HTTP] ${request.method} ${request.url} -> ${status} - ${JSON.stringify(message)}`,
      );
    }

    return response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

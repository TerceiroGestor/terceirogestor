import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import {
  DomainConflictError,
  DomainError,
  DomainForbiddenError,
  DomainNotFoundError,
  DomainValidationError,
} from './domain.error';

const resolveStatus = (exception: DomainError) => {
  if (exception instanceof DomainValidationError) {
    return HttpStatus.BAD_REQUEST;
  }
  if (exception instanceof DomainForbiddenError) {
    return HttpStatus.FORBIDDEN;
  }
  if (exception instanceof DomainNotFoundError) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof DomainConflictError) {
    return HttpStatus.CONFLICT;
  }

  return HttpStatus.UNPROCESSABLE_ENTITY;
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();

    response.status(resolveStatus(exception)).json({
      statusCode: resolveStatus(exception),
      message: exception.message,
      error: exception.name,
    });
  }
}
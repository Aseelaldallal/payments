import { BadRequestException, HttpStatus } from '@nestjs/common';

export class ValidationFailedException extends BadRequestException {
  public constructor(errors: { field: string; message: string }[]) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_FAILED',
      message: 'The request is not valid.',
      errors,
    });
  }
}

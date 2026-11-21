import { Injectable, ParseUUIDPipe } from '@nestjs/common';
import { ValidationFailedException } from '../../shared/http/exceptions/validation-failed.exception';

@Injectable()
export class PaymentIdPipe extends ParseUUIDPipe {
  public constructor() {
    super({
      version: '4',
      exceptionFactory: () =>
        new ValidationFailedException([
          {
            field: 'id',
            message: 'must be a valid id',
          },
        ]),
    });
  }
}

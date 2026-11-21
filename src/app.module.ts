import { ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import type { ValidationError } from 'class-validator';
import { PaymentsModule } from './payments/payments.module';
import { BankModule } from './bank/bank.module';
import { ValidationFailedException } from './shared/http/exceptions/validation-failed.exception';

@Module({
  imports: [PaymentsModule, BankModule],
  providers: [
    // APP_PIPE is the slot that makes a pipe apply to every route in the app. It is not
    // tied to any one pipe: whatever pipe is registered here runs on every request.
    //
    // The pipe registered here is a ValidationPipe. It checks data on the way in: it
    // takes the request body, compares it to the DTO class the handler asked for, and
    // rejects it with a 400 if it does not fit.
    //
    // It is registered globally so every controller is validated the same way, and a new
    // controller is covered without anyone remembering to add it.
    //
    // It is registered in AppModule, not main.ts, so tests get it too: they build the app
    // from AppModule and never run main.ts.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        // ValidationPipe calls this factory when request DTO validation fails.
        // Convert class-validator's errors into the API's validation-error shape.
        exceptionFactory: (validationErrors: ValidationError[]) =>
          new ValidationFailedException(
            validationErrors.flatMap((error) => {
              const messages = Object.values(error.constraints ?? {});
              return messages.map((message) => ({
                field: error.property,
                message,
              }));
            }),
          ),
      }),
    },
    // APP_INTERCEPTOR is the slot that makes an interceptor apply to every route in the
    // app. The interceptor registered here is a ClassSerializerInterceptor. It transforms
    // data on the way out using the response class selected by @SerializeOptions.
    //
    // excludeExtraneousValues is configured globally so only properties marked with
    // @Expose are returned. A new response field is hidden unless someone explicitly
    // approves it in the response DTO.
    //
    // Reflector is supplied by Nest so the interceptor can read route metadata such as
    // @SerializeOptions({ type: PaymentResponseDto }).
    //
    // It is registered in AppModule, not main.ts, so tests get the same serialization
    // behavior when they build the app from AppModule.
    {
      provide: APP_INTERCEPTOR,
      // Reflector is Nest's label reader. A decorator such as
      // @SerializeOptions({ type: PaymentResponseDto }) sticks a hidden label on a handler.
      // The interceptor asks Reflector which label is on the handler being called, so it
      // knows which response class to use. Only Nest can supply Reflector, which is why it
      // is injected here instead of being built by hand.
      inject: [Reflector],
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector, {
          excludeExtraneousValues: true,
        }),
    },
  ],
})
export class AppModule {}

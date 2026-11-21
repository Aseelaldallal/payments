# Payments Platform TODO

## Recommended next order

1. Define common error information: `code` and `message`.
2. Standardize the HTTP error envelope.
3. Standardize the bank report line-result error shape.
4. Extract ACH/NACHA return and reversal policy definitions.
5. Update `BankService` error translation using the settled contracts.

## PaymentsService

- [x] Implement `GET /payments/:id/history`.
- [x] Store history timestamps as `createdAt` and map them to API field `at`.
- [ ] Add comprehensive unit tests for `PaymentsService`, repository history behavior, and rejected transitions.
- [x] Replace hardcoded payment history event strings with a fixed typed event vocabulary.
- [ ] Implement scheduled `SETTLED -> FINAL` processing.
- [ ] Explore extracting lifecycle checks into a state-transition component.
- [ ] Type failure causes and validate that each cause is consistent with the payment's current status.
- [ ] Explore extracting NACHA return/reversal rules from `PaymentsService`.
- [x] Review and clean up the payments feature's file and folder organization.

## BankService

- [x] Update bank-report rejection handling to pass the correct failure cause into `PaymentsService.fail`.
- [x] Translate coded payment failures into human-readable report-line errors.
- [x] Ensure unexpected/internal errors do not expose their messages in report results.
- [ ] Finish strict validation of bank-report dates.
- [x] Validate the top-level bank-report envelope while preserving per-line processing.
- [ ] Decide how to handle NOC lines and update account data.
- [x] Move bank report result interfaces out of `bank.service.ts`.

## PaymentsController and API

- [ ] Standardize one HTTP error envelope across Nest validation, UUID parsing, malformed JSON, and application errors.
- [ ] Define API error codes in a shared enum instead of repeating string literals.
- [ ] Decide the field-validation response shape.
- [ ] Add response DTOs instead of returning the internal `Payment` object directly.
- [ ] Decide whether controllers should explicitly map transport DTOs to service inputs.
- [ ] Separate public routes from administrative/operational routes.

## Dates

- [ ] Finish consistent date-only validation for bank-report inputs.
- [ ] Review whether shared utilities need a stable-message date error or a reusable metadata-carrying error base.

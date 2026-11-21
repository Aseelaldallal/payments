# Payments Platform TODO

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
- [ ] Translate coded payment failures into human-readable report-line rules.
- [ ] Ensure unexpected/internal errors do not expose their messages in report results.
- [ ] Finish strict validation of bank-report dates.
- [ ] Review top-level bank-report DTO/runtime validation and validation ownership.
- [ ] Decide how to handle NOC lines and update account data.
- [ ] Move bank report result interfaces out of `bank.service.ts`.

## PaymentsController and API

- [ ] Standardize one HTTP error envelope across Nest validation, UUID parsing, malformed JSON, and application errors.
- [ ] Decide the field-validation response shape.
- [ ] Add response DTOs instead of returning the internal `Payment` object directly.
- [ ] Decide whether controllers should explicitly map transport DTOs to service inputs.
- [ ] Separate public routes from administrative/operational routes.

## Dates

- [ ] Finish consistent date-only validation for bank-report inputs.
- [ ] Review whether shared utilities need a stable-message date error or a reusable metadata-carrying error base.

# Payments Platform TODO

## PaymentsService

- [ ] Implement `GET /payments/:id/history`.
- [ ] Implement scheduled `SETTLED -> FINAL` processing.
- [ ] Explore extracting lifecycle checks into a state-transition component.
- [ ] Explore extracting NACHA return/reversal rules from `PaymentsService`.
- [ ] Review and clean up the payments feature's file and folder organization.

## BankService

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

## Dates and persisted state

- [ ] Finish consistent date-only validation for bank-report inputs.
- [ ] Validate persisted payment records and status-dependent invariants at the repository/mapping boundary.
- [ ] Review whether shared utilities need a stable-message date error or a reusable metadata-carrying error base.

# payments-platform

The fictional platform built across the US Payments Curriculum projects.
Business partners each have a virtual account inside one FBO account at a
sponsor bank. A partner funds its virtual account by an ACH pull the
platform originates. This service is the platform's payment service.

Stack: Node 22, NestJS 10, TypeScript. Storage is in memory for now.

## Run

```
npm install
npm start            # http://localhost:3000
npm test             # your own tests, in ./test
npm run test:hidden  # the current project's hidden tests, in ./hidden-tests
```

## The bank

The platform talks to one sponsor bank. The bank is simulated: everything
it would tell us arrives as lines in a daily report, posted to
`POST /bank/reports`. The bank never checks return windows for us; it
passes on whatever the receiving bank sent. Line types are in
`src/bank/bank-report.ts`.

Dates are ISO strings, `YYYY-MM-DD`. Banking-day arithmetic, including the
Federal Reserve holiday calendar, is in `src/shared/calendar.ts`; the hidden
tests use the same file.

## API, as it stands

| Method | Path                  | What it does today                                                                                                                   |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | /payments             | Create a pull. Body: partnerId, amountCents, receiverAccountType (consumer or business), secCode (PPD, CCD, WEB, TEL), effectiveDate |
| GET    | /payments/:id         | Read a payment                                                                                                                       |
| POST   | /payments/:id/submit  | Sweep: the entry has been handed to the bank in the file                                                                             |
| POST   | /payments/:id/cancel  | Cancel the pull                                                                                                                      |
| POST   | /payments/:id/reverse | Body: reason. Send a reversing entry                                                                                                 |
| PATCH  | /payments/:id/status  | Admin tool: set the status to anything                                                                                               |
| POST   | /bank/reports         | Apply the bank's daily report                                                                                                        |

Every one of these ends up in `PaymentsService.setStatus`, which sets any
status from any status.

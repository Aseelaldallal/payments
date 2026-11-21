# payments-platform

The fictional platform built across the US Payments Curriculum projects.
Business partners each have a virtual account inside one FBO account at a
sponsor bank. A partner funds its virtual account by an ACH pull the
platform originates. This service is the platform's payment service.

## Project 1: the task

**Your task.** Make the lifecycle a state machine. Only the legal transitions from your diagram, each recorded with an event, a reason where there is one, and a timestamp. A return after settlement is accepted only inside the window for its code and the Receiver's account type, counted from the settlement date in banking or calendar days as the rule says; a late return leaves the payment untouched and reports the rule that blocked it. A reversal is accepted only within 5 banking days and only for the four permitted reasons. The full history of any payment can be read back in order.

**The contract the hidden tests use.** Same endpoints as today, with these shapes:

| Call                               | Expected behaviour                                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST /payments/:id/submit, /cancel | 200 on a legal transition; 409 otherwise                                                                                                                                                           |
| POST /payments/:id/reverse         | Body `{ reason }`. `reason` is one of duplicate, wrong_amount, wrong_account, wrong_date. The reversal happens now. 200 or 409                                                                     |
| PATCH /payments/:id/status         | Either remove it (404) or make it refuse illegal moves (409). It must never bypass the machine                                                                                                     |
| POST /bank/reports                 | Always 200. Body `{ results: [{ paymentId, type, applied, rule? }] }`, one per line, in order. A line that cannot be applied has `applied: false` and a `rule` string; the other lines still apply |
| GET /payments/:id/history          | 200, array oldest first: `{ from, to, event, reason, at }`. First entry has `from: null`, `to: "CREATED"`                                                                                          |
| Any 409                            | Body has a `rule` string a human can read, naming the window where one applies: "2 banking days", "60 calendar days", "5 banking days"                                                             |

Use `src/shared/calendar.ts` for day arithmetic; the tests use the same file. The bank's line types are in `src/bank/bank-report.ts`; `returnDate` on a RETURN line is the settlement date of the return entry.

Adding FINAL as a ninth status is your call; the tests do not touch it.

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

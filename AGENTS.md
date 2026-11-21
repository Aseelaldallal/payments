# AGENTS.md

Always follow NestJS best practices and the conventions in the official NestJS docs. Where this file is more specific, this file wins.

## Folders

Organize by feature. Each feature is a folder under `src/`.

### Inside a feature folder

- `domain/`: Business vocabulary: fixed sets of values such as statuses and events.
- `types/`: Class contracts. One file per class, named `<class file>.types.ts`. Holds the inputs and outputs of that class's public methods, in two sections: Inputs, then Outputs.
- `persistence/`: The shapes the repository stores and returns.
- `dto/`: What crosses HTTP. Request DTOs carry validation. Response DTOs define what the client sees.
- `errors/`: Business failures raised by the service. No HTTP status codes.
- `filters/`: Translate those errors into HTTP responses.

### Files at the feature root

- `*.controller.ts`: HTTP in and out. No business rules.
- `*.service.ts`: The business rules. Transforms stored shapes into what outer layers need.
- `*.repository.ts`: Stores and loads.
- `*.module.ts`: Nest wiring.

### Outside features

- `src/shared/`: Helpers that belong to no single feature.

## HTTP success responses

| Response | Shape |
|---|---|
| Single resource | The object itself |
| Collection | An object containing a named array |
| Batch operation | An object containing a named `results` array |

No generic success envelope.

Applied:

| Endpoint | Returns |
|---|---|
| Payment endpoints | `{ "id": "...", "status": "SETTLED", ... }` |
| `GET /payments/:id/history` | `{ "entries": [...] }` |
| `POST /bank/reports` | `{ "results": [...] }` |

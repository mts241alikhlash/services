# T058 Report

## Status

T058 complete.

## Scope

Rewired circulation module and public index only:

- `src/inventory/circulation/circulation.module.ts`
- `src/inventory/circulation/index.ts`

## Module Wiring

- Registered `PrismaCirculationRepository` once as the concrete provider.
- Bound `ILoanRepository`, `IHistoryRepository`,
  `ITransactionTypeRepository`, and `ICirculationCapabilitiesRepository`
  with `useExisting`, so every port resolves to the same runtime repository
  instance.
- Registered all five moved use cases and both moved HTTP controllers.
- Exported all four split repository ports for inventory consumers.

## Public Exports

`circulation/index.ts` now exports the four split ports and their plain input and
output contracts. It does not import presentation, application, infrastructure,
or module code, so no import cycle was introduced.

## Consumer and Obsolete Interface Check

- No approval or shared consumer required a public circulation-port import.
- `ICirculationRepository` remains active in the moved Prisma adapter and the
  existing characterization specs. It was not removed because active references
  remain; it is no longer a module provider or public circulation export.
- No schema, package, planning, task, approval, or broad cleanup changes made.

## Verification

Command run from `D:\Project\241 Apps\inventory-service`:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/circulation --runInBand
Test Suites: 8 passed, 8 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        9.316 s
Ran all test suites matching inventory/circulation.
```

## Corrective Review

Public circulation exports now include nested plain output contracts needed by
loan and history results. Module tokens and runtime wiring remain unchanged.

No schema, package, approval, or ownership changes made. No subagents used. No
commit created.

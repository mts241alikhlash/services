# Review package: T022

Task: Add characterization tests for all five current circulation use cases before moving files.

Expected files:

- `src/inventory/circulation/use-cases/create-loan.use-case.spec.ts`
- `src/inventory/circulation/use-cases/get-loans.use-case.spec.ts`
- `src/inventory/circulation/use-cases/get-loan-by-id.use-case.spec.ts`
- `src/inventory/circulation/use-cases/get-histories.use-case.spec.ts`
- `src/inventory/circulation/use-cases/return-loan.use-case.spec.ts`

Constraints: test-only characterization; no production, DTO, module, package, schema, planning, or task-file changes.

Fresh verification:

- `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=circulation/use-cases --runInBand`: 5 suites, 16 tests passed.
- Prettier passed.
- ESLint and strict ESLint passed.
- `pnpm run typecheck` passed.

## Fix evidence

- `create-loan.use-case.spec.ts`: success characterization now asserts
  `findUnitsByIds` receives exact `unitIds` and `findLatestLoan` is called with
  no arguments.
- `return-loan.use-case.spec.ts`: not-found characterization now asserts both
  `findStatusBySystemKey` and `findTransactionTypeByCode` are not called.
- `create-loan.use-case.spec.ts`: loan-number date-prefix characterization now
  uses `jest.useFakeTimers()` and `jest.setSystemTime(new Date('2026-09-14T12:00:00.000Z'))`,
  restoring real timers in `finally`.
- Focused tests: `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=circulation/use-cases --runInBand` — 5 suites passed, 16 tests passed.
- Modified specs Prettier: `pnpm exec prettier --check "src/inventory/circulation/use-cases/create-loan.use-case.spec.ts" "src/inventory/circulation/use-cases/return-loan.use-case.spec.ts"` — passed.
- ESLint: `pnpm run lint` — passed.
- Strict ESLint: `pnpm run lint:strict` — passed.
- Typecheck: `pnpm run typecheck` — passed.
- Full `pnpm run format:check` remains blocked by pre-existing formatting failure in `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`; no unrelated file changed.

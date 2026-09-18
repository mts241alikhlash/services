# T040 Report

## Review Fix

Added `src/inventory/reference-data/status/domain/repositories/status.repository.spec.ts`
with compile-time assertions that:

- `StatusRepositoryOutput` rejects `deletedAt`.
- `systemKey` is required.
- `StatusRepositoryOutput['systemKey']` is exactly `InventoryStatusKey | null`.

Updated `status.repository.ts` to remove `deletedAt` and make output `systemKey`
required with type `InventoryStatusKey | null`. All other methods and fields are
preserved. No adapter, use case, DTO, controller, module, planning, task,
package, or schema changes.

### TDD Red

Commands ran before the port fix:

| Command | Result |
| --- | --- |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/status/domain/repositories/status.repository.spec.ts --runInBand` | Runtime assertions passed: 1 suite, 1 test. |
| `pnpm run typecheck` | Failed as expected: `TS2578` for unused `deletedAt` and missing `systemKey` assertions, `TS2344`/`TS2322` for the incorrect optional string-template type. |

The typecheck failure proved stale `deletedAt` was accepted, omitted
`systemKey` was accepted, and `systemKey` was not exactly `InventoryStatusKey |
null`.

### TDD Green

Commands ran after the port fix:

| Command | Result |
| --- | --- |
| `pnpm run typecheck` | Passed. `tsc --noEmit` exited 0. |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/status --runInBand` | Passed. 2 suites, 8 tests. Node emitted its existing VM Modules experimental warning. |

## Change

Added `src/inventory/reference-data/status/domain/repositories/status.repository.ts` with:

- Explicit `StatusCreateRepositoryInput` fields: `code`, `name`, `allowTransactions`, and nullable `systemKey`.
- Explicit `StatusUpdateRepositoryInput` fields. No `Partial`.
- Plain `StatusRepositoryOutput` projection with `allowTransactions`, required nullable `systemKey`, and `createdAt`.
- Existing repository methods: `findMany`, `findById`, `create`, `update`, and `delete`.
- No Prisma, DTO, HTTP, controller, or infrastructure imports.

No adapter, use case, DTO, controller, module, or test changes beyond the
required repository contract spec above.

## Verification

Commands run from `inventory-service`:

| Command | Result |
| --- | --- |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=reference-data/status --runInBand` | Superseded by green review-fix result above: 2 suites, 8 tests passed. |
| `pnpm run typecheck` | Superseded by green review-fix result above: `tsc --noEmit` exited 0. |
| `pnpm exec prettier --check "src/inventory/reference-data/status/**/*.ts"` | Passed. All status files use Prettier code style. |
| `pnpm run format:check` | Failed on pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`; no T040 file caused the failure and no unrelated file was changed. |
| `pnpm run lint` | Passed. ESLint exited 0 with max warnings set to 0. |
| `pnpm run lint:strict` | Passed. Strict ESLint exited 0 with max warnings set to 0. |

Repository-port import scan found no Prisma, `PrismaService`, DTO, HTTP,
controller, or infrastructure imports. Port scan found no `Partial`.

No Git commit created.

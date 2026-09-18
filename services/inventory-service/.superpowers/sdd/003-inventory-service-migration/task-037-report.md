# T037 Report

## Scope

Moved location HTTP request/response DTOs, controller, and controller spec into
the layered HTTP presentation boundary. No application, domain, infrastructure,
schema, package, planning, or task files changed.

## Files Changed

Added:

- `src/inventory/reference-data/location/presentation/http/location.controller.ts`
- `src/inventory/reference-data/location/presentation/http/location.controller.spec.ts`
- `src/inventory/reference-data/location/presentation/http/dto/request/create-location.dto.ts`
- `src/inventory/reference-data/location/presentation/http/dto/request/update-location.dto.ts`
- `src/inventory/reference-data/location/presentation/http/dto/response/location-response.dto.ts`

Modified:

- `src/inventory/reference-data/location/location.module.ts`
- `src/inventory/reference-data/dto/response/metadata-response.dto.ts`

Removed:

- `src/inventory/reference-data/location/presentation/location.controller.ts`
- `src/inventory/reference-data/location/presentation/location.controller.spec.ts`
- `src/inventory/reference-data/location/dto/request/create-location.dto.ts`
- `src/inventory/reference-data/location/dto/request/update-location.dto.ts`
- `src/inventory/reference-data/location/dto/response/location-response.dto.ts`

## Preserved Behavior

- Routes remain `GET /inventory/locations`, `POST /inventory/locations`,
  `PATCH /inventory/locations/:id`, and `DELETE /inventory/locations/:id`.
- `JwtAuthGuard`, bearer Swagger metadata, permission decorators, operation
  summaries, response DTO metadata, UUID pipes, validation decorators, response
  envelopes, application input mapping, and statuses remain unchanged.
- Metadata response DTO now imports location response DTO from its HTTP-only path.
- Controller and DTO imports remain inside presentation HTTP files; application
  use cases do not import DTOs.

## Verification

Commands ran from `D:\Project\241 Apps\inventory-service` on 2026-09-14.

| Command | Result |
| --- | --- |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/location --runInBand` | Passed. 2 suites, 13 tests. |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=app.module.boots.spec.ts --runInBand` | Passed. 1 suite, 1 test. |
| `pnpm exec prettier --check "src/inventory/reference-data/location/presentation/http/**/*.ts" "src/inventory/reference-data/location/location.module.ts" "src/inventory/reference-data/dto/response/metadata-response.dto.ts"` | Passed. All matched files use Prettier style. |
| `pnpm run format:check` | Failed on pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`; no T037 file reported. |
| `pnpm run lint` | Passed. |
| `pnpm run lint:strict` | Passed. |
| `pnpm run typecheck` | Passed. |

Stale location-layout search found no old controller or DTO imports under
`src`. No commit created. No subagents used.

## Residual Risk

Repository-wide Prettier remains red because of the unrelated condition
controller spec. Fixing it would change a file outside T037 and was skipped.

## Review Fixes

### Findings

- Location GET lacked explicit optional `search` Swagger query metadata.
- Location DELETE lacked explicit Swagger 204 response metadata.

The funding-source controller provided the exact reference pattern. The stale
generated location artifact also showed both decorators, but was used only as
evidence and was not changed.

### Red/Green Evidence

Added reflection assertions for `DECORATORS.API_PARAMETERS` on
`getLocations` and `DECORATORS.API_RESPONSE` status `204` on `deleteLocation`.

Before controller changes:

`pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/location/presentation/http/location.controller.spec.ts --runInBand`

Failed as expected: 1 suite failed, 6 tests passed, 1 failed. GET query
metadata was `undefined` instead of the optional `search` parameter.

Added the exact decorators:

```ts
@ApiQuery({ name: 'search', required: false })
@ApiResponse({ status: HttpStatus.NO_CONTENT })
```

After controller changes, the same command passed: 1 suite, 7 tests.

## Review-Fix Verification

| Command | Result |
| --- | --- |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=inventory/reference-data/location --runInBand` | Passed. 2 suites, 13 tests. |
| `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=app.module.boots.spec.ts --runInBand` | Passed. 1 suite, 1 test. |
| `pnpm exec prettier --check "src/inventory/reference-data/location/presentation/http/**/*.ts" "src/inventory/reference-data/location/location.module.ts" "src/inventory/reference-data/dto/response/metadata-response.dto.ts"` | Passed. All matched files use Prettier style. |
| `pnpm run format:check` | Failed on unrelated pre-existing `src/inventory/reference-data/condition/presentation/http/condition.controller.spec.ts`; no T037 file reported. |
| `pnpm run lint` | Passed. |
| `pnpm run lint:strict` | Passed. |
| `pnpm run typecheck` | Passed. |

No routes, DTOs, application/domain/infrastructure code, schema, package,
planning, or task files changed. No subagents used. No commit created.

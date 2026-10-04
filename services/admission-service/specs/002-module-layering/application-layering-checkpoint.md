# Application Layering Checkpoint

## T013

- Status policy moved to `src/admission/application/domain/policies/`.
- Application entities and repository contract moved to `domain/entities/` and `domain/repositories/`.
- Application serializers moved to `domain/serializers/`.
- Application use cases moved to `application/use-cases/<name>/` with plain input types.
- Prisma repository and Prisma mapping helpers moved to `infrastructure/persistence/prisma/`.
- Student enrolment port, HTTP adapter, and integration module moved to `infrastructure/integration/`.
- Admin controller and request DTOs moved to `presentation/http/`.
- `application.module.ts` and `index.ts` added as module and public API boundaries.
- Root module and applicant, document, and payment consumers updated.
- Legacy empty directories removed: `application/dto`, `application/integration`, `application/use-cases`, `application/domain/interfaces`, and `admission/presentation`.
- `ACCEPTED -> ENROLLED` transition, student integration before local `ENROLLED` mark, notification order, routes, permissions, and response behavior preserved.
- No `ENROLLING`, retry, `applicationId`, or saga behavior added.

## T014 Verification

| Check                                        | Result                   |
| -------------------------------------------- | ------------------------ |
| Application workflow, stats, and rules tests | PASS, 25 tests, 3 suites |
| Cross-context focused tests                  | PASS, 37 tests, 8 suites |
| Boot and route-conflict tests                | PASS, 4 tests, 2 suites  |
| `pnpm run typecheck`                         | PASS                     |
| `pnpm run lint`                              | PASS                     |
| `pnpm run lint:strict`                       | PASS                     |
| `pnpm run format:check`                      | PASS                     |
| `pnpm run build`                             | PASS                     |
| Forbidden dependency-direction scans         | PASS, no matches         |
| Stale legacy-path scan                       | PASS, no matches         |
| Domain Prisma/HTTP DTO scan                  | PASS, no matches         |
| Application-layer Prisma/HTTP DTO scan       | PASS, no matches         |

Full-suite note: `pnpm test -- --runInBand` forwards the extra separator as a Jest path and reports no tests. Direct ESM Jest execution reaches the suite but logs existing identity-service 503 responses in external-service tests. No source failure was attributed to T013-T014.

## Cleanup Verification

- Removed empty directories `src/admission/wave/domain/interfaces/` and
  `src/admission/wave/dto/`; no source files were removed.
- Confirmed and removed zero-byte root scan artifacts `target`,
  `target.startsWith(root)))hits.push(path.relative(process.cwd()`, and
  `target.startsWith(r)))hits.push(path.relative(process.cwd()`; none is
  project source or configuration.
- Fresh source scans, run after cleanup:

  | Scan                                                                    | Exact result                                         |
  | ----------------------------------------------------------------------- | ---------------------------------------------------- |
  | Stale legacy-path source matches                                        | PASS, 0                                              |
  | Old flat application source files                                       | PASS, 0 present                                      |
  | Domain Prisma/HTTP DTO imports                                          | PASS, 0                                              |
  | Application Prisma/HTTP DTO imports                                     | PASS, 0                                              |
  | Presentation repository/Prisma/infrastructure imports                   | PASS, 0                                              |
  | Public API DTO/Prisma exports or imports                                | PASS, 0                                              |
  | `ENROLLING`, saga, or retry markers in application workflow/integration | PASS, 0                                              |
  | `applicationId` in student integration adapter/port                     | PASS, 0                                              |
  | Cross-context imports bypassing `index.ts`                              | PASS, 7 classified intentional direct imports remain |

- The seven classified intentional direct imports remain unchanged: two
  applicant infrastructure Prisma helper imports, three composite-controller
  HTTP DTO imports, and two document/payment direct status-policy imports
  avoiding application<->context barrel cycles. No production behavior changes
  made.

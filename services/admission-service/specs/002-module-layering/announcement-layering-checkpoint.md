# Announcement Layering Checkpoint

## Scope

Completed `T003-T004`. Routes, permission codes, validation, response shapes,
status codes, search/order behavior, `notifyScope`, publication timestamps, and
notification persistence remain unchanged.

## Exact Moves

- `announcement/domain/interfaces/admission-announcement-repository.interface.ts` -> `announcement/domain/repositories/admission-announcement-repository.ts`
- `announcement/infrastructure/persistence/prisma-admission-announcement.repository.ts` -> `announcement/infrastructure/persistence/prisma/prisma-admission-announcement.repository.ts`
- `announcement/dto/request/*.dto.ts` -> `announcement/presentation/http/dto/request/*.dto.ts`
- `announcement/use-cases/*.use-case.ts` -> `announcement/application/use-cases/<name>/<name>.use-case.ts`
- `announcement/use-cases/admission-announcement.use-cases.spec.ts` -> `announcement/application/use-cases/admission-announcement.use-cases.spec.ts`
- `admission/presentation/admission-announcement.controller.ts` -> `announcement/presentation/http/admission-announcement.controller.ts`
- New plain inputs: `get-admission-announcements.input.ts`, `create-admission-announcement.input.ts`, and `update-admission-announcement.input.ts`.
- New `announcement/announcement.module.ts` owns announcement HTTP, administration use cases, repository port, and Prisma adapter.
- New `announcement/index.ts` exposes `AnnouncementModule`, `GetPublishedAnnouncementsUseCase`, and the announcement relation type used by applicant persistence.
- `admission/admission.module.ts` imports `AnnouncementModule` and no longer owns announcement administration wiring.
- Applicant controller and applicant persistence use the announcement public API for cross-context imports.

## Behavior Checks

- `CreateAdmissionAnnouncementUseCase` still stamps `publishedAt` for published creates and leaves drafts with `publishedAt: null`.
- `UpdateAdmissionAnnouncementUseCase` still stamps `publishedAt` only when transitioning to published.
- `PublishAdmissionAnnouncementUseCase` still publishes before calling `notifyScope(waveId, title, content)`.
- `DeleteAdmissionAnnouncementUseCase` still soft-deletes active announcements.
- `PrismaAdmissionAnnouncementRepository.notifyScope()` still fans out `ANNOUNCEMENT` notifications to matching active applications, including global scope behavior.

## Forbidden-Import Scans

Scanned `src/**/*.ts`:

- Stale announcement paths (`announcement/use-cases`, `announcement/dto`, `announcement/domain/interfaces`, old Prisma path, old controller path): no matches.
- Announcement domain imports from presentation/DTO/Prisma: no matches.
- Announcement application imports from DTO/Prisma: no matches.
- Announcement presentation imports of repository/Prisma internals: no matches.

## Cleanup

- Removed empty legacy directories: `announcement/domain/interfaces/`,
  `announcement/dto/`, and `announcement/use-cases/`.
- Re-ran stale-path and forbidden-import scans across `src/**/*.ts`: no matches.
- No source files removed.

## Commands And Results

- `pnpm test -- announcement/application/use-cases/admission-announcement.use-cases.spec.ts --runInBand`: PASS, 1 suite, 6 tests.
- `pnpm test -- announcement/application/use-cases/admission-announcement.use-cases.spec.ts app.module.boots.spec.ts route-conflicts.spec.ts route-collisions.spec.ts --runInBand`: PASS, 4 suites, 13 tests.
- `pnpm run format:check`: PASS.
- `pnpm run lint`: PASS, zero errors and warnings.
- `pnpm run lint:strict`: PASS, zero errors and warnings.
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- `pnpm test --runInBand`: PASS, 19 suites, 135 tests. Expected fail-closed identity-service 503/timeout logs appeared; no test failures.
- `pnpm run validate`: PASS, format check, lint, typecheck, strict lint, full test, and build.

## Concerns

- `GetPublishedAnnouncementsUseCase` still consumes the broad applicant repository port. Applicant context has no public module yet; root provides this cross-context operation until applicant layering.
- Full tests log identity-service failures because external identity-service is unavailable; existing fail-closed behavior remains intact.

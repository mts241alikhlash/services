# Preflight: Admission Bounded-Context Split

Date: 2026-09-13
Scope: T001-T002 only. No files under `src/` changed.

## Source Inventory

Current `src/admission/` count: 85 TypeScript files.

| Current path | Files | Source count | Planned context ownership |
|---|---|---:|---|
| `domain/` | status transitions, serializers, enrolment rules and spec | 4 | `application` |
| `domain/entities/` | 8 entities: applicant, application, application parent, wave, announcement, document, file, payment | 8 | `applicant`, `application`, `wave`, `announcement`, `document`, `payment` |
| `domain/interfaces/` | 4 repository interfaces | 4 | `applicant`, `application`, `wave`, `announcement` |
| `dto/request/` | 17 request DTOs | 17 | DTOs listed file-by-file in the seven-context mapping below |
| `infrastructure/persistence/` | 6 Prisma adapters/includes/reference helpers | 6 | `applicant`, `application`, `wave`, `announcement`; shared repository reads remain explicit until Stage 2 |
| `integration/` | `student-enrolment.port.ts`, HTTP adapter, module | 3 | `application` |
| `presentation/` | 5 audience controllers | 5 | Controllers remain intact; imports change to context paths |
| `services/` | `admission-notification.service.ts` | 1 | `notification` |
| `use-cases/` | 30 use-case implementations and 5 use-case specs | 35 | Use cases listed file-by-file in the seven-context mapping below |
| root | `admission.module.ts`, `index.ts` | 2 | root composition and service entry point remain |

Current source counts from directory inventory:

- 85 files under `src/admission/`
- 8 domain entities
- 4 repository interfaces
- 17 request DTOs
- 6 persistence files
- 3 integration files
- 5 controllers
- 1 admission service
- 30 use-case implementation files
- 5 use-case spec files
- 6 admission spec files total, including `domain/enroll-as-student.rules.spec.ts`

## Seven-Context Mapping

| Context | Current entity/repository/integration ownership | Current use-case files | Current DTO files |
|---|---|---|---|
| `wave` | `domain/entities/admission-wave.entity.ts`, `domain/interfaces/admission-wave-repository.interface.ts`, `infrastructure/persistence/prisma-admission-wave.repository.ts`, wave controller references, and `use-cases/admission-wave.use-cases.spec.ts` | `get-active-waves.use-case.ts`, `get-admission-waves.use-case.ts`, `get-admission-wave-by-id.use-case.ts`, `create-admission-wave.use-case.ts`, `update-admission-wave.use-case.ts`, `delete-admission-wave.use-case.ts` (6 total; `GetActiveWavesUseCase` is wave-owned) | `admission-wave-ids.dto.ts`, `admission-wave-query.dto.ts`, `create-admission-wave.dto.ts`, `update-admission-wave.dto.ts` |
| `announcement` | `domain/entities/admission-announcement.entity.ts`, `domain/interfaces/admission-announcement-repository.interface.ts`, `infrastructure/persistence/prisma-admission-announcement.repository.ts`, announcement controller references, and `use-cases/admission-announcement.use-cases.spec.ts` | `get-admission-announcements.use-case.ts`, `get-published-announcements.use-case.ts`, `create-admission-announcement.use-case.ts`, `update-admission-announcement.use-case.ts`, `publish-admission-announcement.use-case.ts`, `delete-admission-announcement.use-case.ts` (6 total) | `admission-announcement-query.dto.ts`, `create-admission-announcement.dto.ts`, `update-admission-announcement.dto.ts` |
| `applicant` | `domain/entities/admission-applicant.entity.ts`, applicant repository operations in `domain/interfaces/admission-applicant-repository.interface.ts` and `infrastructure/persistence/prisma-admission-applicant.repository.ts`, public/applicant controller references, and applicant use-case coverage | `register-applicant.use-case.ts`, `get-my-application.use-case.ts`, `update-my-application.use-case.ts`, `submit-application.use-case.ts` (4 total) | `register-applicant.dto.ts`, `update-my-application.dto.ts` |
| `document` | `domain/entities/admission-document.entity.ts`, document-related `domain/entities/admission-file.entity.ts` usage, applicant/admin controller references, and document workflow coverage | `upload-admission-document.use-case.ts`, `verify-document.use-case.ts` (2 total) | `verify-document.dto.ts` |
| `payment` | `domain/entities/admission-payment.entity.ts`, payment-related `domain/entities/admission-file.entity.ts` usage, applicant/admin controller references, and payment workflow coverage | `upload-payment-proof.use-case.ts`, `verify-payment.use-case.ts` (2 total) | `upload-payment-proof.dto.ts`, `verify-payment.dto.ts` |
| `notification` | `services/admission-notification.service.ts`, applicant controller notification routes, and notification calls through `domain/interfaces/admission-applicant-repository.interface.ts` | `get-my-notifications.use-case.ts`, `mark-notification-read.use-case.ts` (2 total) | None |
| `application` | `domain/entities/admission-application.entity.ts`, `domain/entities/admission-application-parent.entity.ts`, `domain/admission-status.transitions.ts`, `domain/admission.serializers.ts`, `domain/enroll-as-student.rules.ts`, `domain/enroll-as-student.rules.spec.ts`, `domain/interfaces/admission-application-repository.interface.ts`, `infrastructure/persistence/prisma-admission-application.repository.ts`, `infrastructure/persistence/prisma-admission-application.includes.ts`, `infrastructure/persistence/prisma-admission.refs.ts`, `integration/`, and admin controller references | `get-admission-stats.use-case.ts`, `get-applications.use-case.ts`, `get-application-by-id.use-case.ts`, `verify-application.use-case.ts`, `accept-application.use-case.ts`, `reject-application.use-case.ts`, `request-revision.use-case.ts`, `enroll-applicant.use-case.ts` (8 total) | `admission-query.dto.ts`, `accept-application.dto.ts`, `enroll-applicant.dto.ts`, `reject-application.dto.ts`, `request-revision.dto.ts` |

Totals reconcile to current source: 30 use-case implementation files and 17 DTO files. Stage 1 keeps current broad repository ports and audience controllers. It moves paths and fixes imports only. Shared `AdmissionFile`, applicant repository methods used by document/payment/notification flows, and application repository methods used by verification flows are deliberate cross-context edges for Stage 2.

## Direct Consumers And Imports

- `src/app.module.ts` directly imports `./admission/admission.module.js` and registers `AdmissionModule`.
- `src/admission/index.ts` exports `AdmissionModule`; no other source consumer imports this entry point.
- `src/admission/admission.module.ts` is composition root. It directly imports `IntegrationModule`, four repository ports, four Prisma adapters, five controllers, `AdmissionNotificationService`, and all 30 use cases. It also imports `AuthModule` and `UserModule`.
- Controllers directly import their request DTOs and injected use cases. Controller files stay in `src/admission/presentation/`; only relative targets change during slices.
- Use cases directly import repository ports, domain rules/serializers, request DTOs, storage services, and `AdmissionNotificationService` where currently used.
- Persistence adapters directly import `PrismaService`, shared repository/reference types, platform account/reference ports, local repository interfaces, and local Prisma include/reference helpers.
- `integration.module.ts` directly binds `IStudentEnrolmentPort` to `HttpStudentEnrolmentAdapter`; `EnrollApplicantUseCase` consumes that port through the existing module.
- No source file outside `src/admission/` imports an internal admission domain, DTO, persistence, presentation, service, or use-case path.

## Route Contract Baseline

Global bootstrap contract: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, enableImplicitConversion: true })`; route prefix/options come from `ROUTE_OPTIONS`; response envelope comes from `ResponseInterceptor`.

| Method | Route | Controller contract | Permission/status notes |
|---|---|---|---|
| GET | `/admissions/waves/active` | public active waves | `@Public()` |
| POST | `/admissions/register` | public applicant registration | `@Public()`, auth throttle, 201/400/409 responses |
| GET | `/admissions/my-application` | applicant current application | JWT |
| PATCH | `/admissions/my-application` | applicant partial update | JWT |
| POST | `/admissions/my-application/submit` | applicant submit | JWT, 201/400 responses |
| PUT | `/admissions/my-application/documents/:typeCode` | applicant document upload | JWT, multipart |
| PUT | `/admissions/my-application/payment` | applicant payment proof upload | JWT, multipart |
| GET | `/admissions/my-application/notifications` | applicant notifications | JWT |
| PATCH | `/admissions/notifications/read-all` | mark all notifications read | JWT |
| PATCH | `/admissions/notifications/:id/read` | mark one notification read | JWT, UUID parameter |
| GET | `/admissions/announcements` | published applicant announcements | JWT |
| GET | `/admissions/stats` | admin admission stats | JWT, `admissions.read` |
| GET | `/admissions/applications` | admin application list | JWT, `admissions.read` |
| GET | `/admissions/applications/:id` | admin application detail | JWT, `admissions.read`, UUID parameter |
| PATCH | `/admissions/applications/:id/documents/:docId/verify` | admin document verification | JWT, `admissions.verify`, UUID parameters |
| PATCH | `/admissions/applications/:id/payment/verify` | admin payment verification | JWT, `admissions.verify`, UUID parameter |
| POST | `/admissions/applications/:id/request-revision` | admin request revision | JWT, `admissions.verify`, UUID parameter |
| POST | `/admissions/applications/:id/verify` | admin application verification | JWT, `admissions.verify`, UUID parameter |
| POST | `/admissions/applications/:id/accept` | admin accept application | JWT, `admissions.decide`, UUID parameter |
| POST | `/admissions/applications/:id/reject` | admin reject application | JWT, `admissions.decide`, UUID parameter |
| POST | `/admissions/applications/:id/enroll` | admin enrol accepted applicant | JWT, `admissions.enroll`, UUID parameter |
| GET | `/admissions/waves` | wave list | JWT, `admission-waves.read` |
| GET | `/admissions/waves/:id` | wave detail | JWT, `admission-waves.read`, UUID parameter |
| POST | `/admissions/waves` | wave create | JWT, `admission-waves.create` |
| PATCH | `/admissions/waves/:id` | wave update | JWT, `admission-waves.update`, UUID parameter |
| DELETE | `/admissions/waves/:id` | wave soft delete | JWT, `admission-waves.delete`, UUID parameter, 204 |
| GET | `/admissions/manage-announcements` | announcement list | JWT, `admission-announcements.read` |
| POST | `/admissions/manage-announcements` | announcement create | JWT, `admission-announcements.create` |
| PATCH | `/admissions/manage-announcements/:id` | announcement update | JWT, `admission-announcements.update`, UUID parameter |
| POST | `/admissions/manage-announcements/:id/publish` | announcement publish and notify | JWT, `admission-announcements.update`, UUID parameter |
| DELETE | `/admissions/manage-announcements/:id` | announcement soft delete | JWT, `admission-announcements.delete`, UUID parameter, 204 |

Baseline route total: 31 method/path combinations across 5 controllers.

## Git Limitation

`git rev-parse --git-dir` failed with `fatal: not a git repository (or any of the parent directories): .git`; no Git metadata or repository is available for checkpoint commits. Per spec, no repository initialization, fake commit, or Git commit was performed. Required slice commit checkpoints remain recorded in `plan.md` only.

The prerequisite script requested by the implementation workflow was unavailable at `.specify\\scripts\\powershell\\check-prerequisites.ps1`; `.specify/` is absent from this workspace.

## Baseline Commands And Exact Results

### `pnpm run typecheck`

```text
$ tsc --noEmit
```

Result: PASS.

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --testPathPatterns=admission`

```text
(node:11372) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:9156) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8448) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
[Nest] 8448  - 09/13/2026, 2:43:42 PM ERROR [HttpIdentityAdapter] identity-service request failed or timed out
[Nest] 8448  - 09/13/2026, 2:43:42 PM ERROR [HttpIdentityAdapter] identity-service answered 503
[Nest] 8448  - 09/13/2026, 2:43:42 PM ERROR [HttpIdentityAdapter] identity-service request failed or timed out

Test Suites: 17 passed, 17 total
Tests:       135 passed, 135 total
Snapshots:   0 total
Time:        12.283 s
Ran all test suites matching admission.
```

Result: PASS. Existing warnings: Node VM Modules experimental warning; identity adapter request failure/timeout and 503 logs.

### `pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest app.module.boots.spec.ts`

```text
(node:1728) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        7.708 s
Ran all test suites matching app.module.boots.spec.ts.
```

Result: PASS. Existing warning: Node VM Modules experimental warning.

### `pnpm run validate`

```text
$ pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run lint:strict && pnpm test && pnpm run build
$ prettier --check "src/**/*.ts"
Checking formatting...
All matched files use Prettier code style!
$ eslint "src/**/*.ts" --max-warnings=0
$ tsc --noEmit
$ eslint -c eslint.typecheck.config.mjs "src/**/*.ts" --max-warnings=0
$ cross-env NODE_OPTIONS=--experimental-vm-modules jest --passWithNoTests
(node:8244) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:528) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:5468) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
[Nest] 8244  - 09/13/2026, 2:44:10 PM ERROR [HttpIdentityAdapter] identity-service request failed or timed out
[Nest] 8244  - 09/13/2026, 2:44:10 PM ERROR [HttpIdentityAdapter] identity-service answered 503
[Nest] 8244  - 09/13/2026, 2:44:10 PM ERROR [HttpIdentityAdapter] identity-service request failed or timed out

Test Suites: 17 passed, 17 total
Tests:       135 passed, 135 total
Snapshots:   0 total
Time:        5.838 s, estimated 10 s
Ran all test suites.
$ nest build
```

Result: PASS, including build. Existing warnings: Node VM Modules experimental warning; identity adapter request failure/timeout and 503 logs.

## Review Fixes And Verification

- Finding 1 fixed: `admission-wave-ids.dto.ts` now appears explicitly in `wave` DTO ownership.
- Finding 2 fixed: wave ownership now lists six use-case files, including `get-active-waves.use-case.ts` and `GetActiveWavesUseCase`; `plan.md` and `tasks.md` use the same count.
- Finding 3 fixed: every current use-case implementation file and every current request DTO file appears by filename in the seven-context mapping. Counts reconcile to 30 and 17.
- Source inventory verification: `src/admission/use-cases/*.use-case.ts` returned 30 files; `src/admission/dto/request/*.dto.ts` returned 17 files.
- Ownership verification: use-case declarations returned 30 `UseCase` classes; DTO declarations covered all 17 DTO files, with two DTO classes in `update-my-application.dto.ts`.
- Change boundary verification: no `src/**/*.ts` file was included in edits. Production source remains unchanged.
- Baseline evidence above remains valid because only documentation files changed after T002.

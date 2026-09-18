# Notification Layering Checkpoint

## Scope

Completed `T011-T012`. Notification creation, applicant-owned reads, read
updates, routes, permissions, responses, text, and persistence behavior remain
unchanged behind explicit domain, application, infrastructure, and HTTP
presentation boundaries.

## Exact Moves

- New `notification/domain/entities/admission-notification.entity.ts` owns the
  framework-free notification row shape.
- New `notification/domain/repositories/admission-notification-repository.ts`
  owns notification creation, applicant lookup, reads, ownership, and update
  contracts.
- New
  `notification/application/services/admission-notification.service.ts` owns
  notification creation through the notification repository port.
- New application use-case directories own `GetMyNotificationsUseCase` and
  `MarkNotificationReadUseCase` with plain string inputs.
- New
  `notification/infrastructure/persistence/prisma/prisma-admission-notification.repository.ts`
  owns all notification read/write Prisma queries and maps the domain string
  type to the Prisma enum at the infrastructure edge.
- New `notification/presentation/http/admission-notification.controller.ts`
  owns the existing three applicant notification routes and their auth,
  validation, and Swagger metadata.
- New `notification/notification.module.ts` wires the Prisma adapter, service,
  use cases, and controller. `notification/index.ts` is the intentional public
  API and exports no HTTP DTOs.
- Document and payment notification adapters, applicant/application workflow
  callers, applicant submission, and announcement publication now import
  notification operations through `notification/index.ts`.
- Empty legacy `notification/use-cases/` and `notification/services/`
  directories were removed.

## Broad Applicant Repository Exception

Applicant repository keeps `createNotification` only because applicant
registration creates its welcome notification inside the same existing Prisma
transaction as the application and payment. Moving that write to the
notification service would make registration non-atomic and change persistence
behavior. All notification reads and ordinary workflow writes use the public
notification API.

## Forbidden-Import Scans

Scanned `src/**/*.ts`:

- Stale notification paths: no matches.
- Notification domain imports from Prisma or `PrismaService`: no matches.
- Notification application imports from Prisma or HTTP DTOs: no matches.
- Notification presentation imports of repositories, Prisma, or infrastructure:
  no matches.
- Notification public API HTTP DTO exports: no matches.
- Notification routes: exactly one declaration for each existing route.

## Behavior Checks

- Applicant notification list still resolves the active applicant application,
  returns latest 50 notifications and unread count, and returns the existing
  `Application not found` error.
- Single-read update still verifies notification ownership through the
  application user relation, preserves existing read timestamps, and returns
  `Notification not found` for non-owned notifications.
- Read-all still updates only unread notifications owned by the applicant and
  returns `{ success: true }`.
- Existing notification creation calls preserve notification types, titles,
  messages, and application IDs.
- Announcement publication still publishes first, then fans out the same
  `ANNOUNCEMENT` notification to the same active application scope through the
  notification service.
- Existing routes remain `GET admissions/my-application/notifications`,
  `PATCH admissions/notifications/read-all`, and
  `PATCH admissions/notifications/:id/read`.

## Commands And Results

- Focused notification, announcement, workflow, applicant, and boot Jest run:
  PASS, 5 suites, 19 tests after final fan-out extraction.
- `pnpm run typecheck`: PASS.
- Dependency scans: PASS, no stale paths or forbidden notification layer
  imports.

## Full Gates

- `pnpm run format:check`: PASS.
- `pnpm run lint`: PASS, zero errors and warnings.
- `pnpm run lint:strict`: PASS, zero errors and warnings.
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- `pnpm run validate`: PASS, including 23 suites and 142 tests.
- Boot coverage: PASS through `src/app.module.boots.spec.ts` in the focused
  run and full validation.
- Existing expected test logs: Node VM Modules experimental warning and
  fail-closed identity-service timeout/503 logs.

## Review Fix Evidence

- Removed unused `GetMyNotificationsUseCase` and `MarkNotificationReadUseCase`
  imports from `src/admission/admission.module.ts`.
- `NotificationModule` remains the sole owner of notification controller,
  providers, and use-case registration; no providers or behavior changed.

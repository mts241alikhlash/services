# Admission Bounded-Context Split

## Goal

Split the flat admission module into seven internal bounded-context modules so
developers can navigate by admission concept without changing runtime behavior.

## Scope

Included contexts:

- `applicant`: `AdmissionApplicant`
- `application`: `AdmissionApplication` and parent data
- `wave`: `AdmissionWave`
- `announcement`: `AdmissionAnnouncement`
- `document`: `AdmissionDocument` and `AdmissionFile`
- `payment`: `AdmissionPayment` and `AdmissionFile`
- `notification`: applicant notifications

Excluded:

- Clean Architecture layering inside each context
- Enrollment saga state changes
- New endpoints, migrations, dependencies, or API behavior
- Repository port redesign

## Requirements

- The seven context directories MUST exist under `src/admission/`.
- Every current entity, use case, DTO, controller reference, repository adapter,
  service, and spec MUST move to its owning context or remain at the root only
  when shared composition requires it.
- Stage 1 MUST preserve the current flat internal layout within each context.
- Each context MUST be moved in its own isolated slice in this order:
  `wave`, `announcement`, `applicant`, `document`, `payment`, `notification`,
  `application`.
- A slice MUST change paths and imports only. It MUST NOT change route paths,
  permissions, validation, status codes, response shapes, repository behavior,
  or integration behavior.
- Shared dependencies MUST be kept explicit. Temporary cross-context imports
  are allowed only when required to preserve behavior and MUST be recorded in
  the slice report for Stage 2 cleanup.
- The root `AdmissionModule` MUST remain the composition root until all seven
  slices are complete.
- Each slice MUST pass typecheck, focused tests, and the existing application
  boot test before the next slice starts.
- The service has no Git metadata in the current workspace. Commit boundaries
  MUST be recorded as required integration checkpoints, but no fake commits or
  repository initialization may be performed.

## Acceptance Scenarios

### Scenario 1: Navigate by context

Given a developer searches for wave behavior, when they open `src/admission/wave/`,
then wave-owned files are found there without scanning the other six contexts.

### Scenario 2: Preserve HTTP behavior

Given any existing admission-web route, when the service is built and booted,
then route path, permission, request validation, status code, and response shape
remain unchanged.

### Scenario 3: Preserve cross-context behavior

Given an applicant submits documents, uploads payment, or reads notifications,
when the existing use case runs, then it still reaches the same repository and
integration behavior as before the move.

### Scenario 4: Slice isolation

Given one context slice is complete, when its focused tests and typecheck run,
then they pass before another context is moved.

## Success Criteria

- Seven context directories exist.
- No old flat-path import remains for a completed context.
- Focused and full test suites pass after every slice.
- `pnpm run validate` passes after Stage 1.
- No route, permission, DTO validation, status, response, or persistence behavior
  changes in Stage 1.

## Assumptions

- Existing source and test behavior is the baseline contract.
- `src/admission/index.ts` remains the service-facing public entry point unless
  a slice requires a narrower export.
- No compatibility aliases are added for old internal paths; consumers are fixed
  directly.

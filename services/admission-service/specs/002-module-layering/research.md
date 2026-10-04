# Research: Admission Module Layering

## Decision

Use the layering procedure already documented in `docs/ARCHITECTURE.md`, one
context per slice, with public APIs for cross-context access.

## Rationale

The service already has repository interfaces, Prisma adapters, controllers,
DTOs, and use-case specs. Moving these seams is lower risk than redesigning
them. The application context is deferred because its enrolment flow currently
crosses the student-service integration and local persistence.

## Special Cases

- `document` and `payment` currently use broad applicant/application repository
  ports. Preserve behavior first; narrow ports only where the migration can
  prove no behavior change.
- Notification persistence is currently embedded in applicant and announcement
  adapters. Its public API must be explicit before extraction.
- Response serializers currently under domain move to presentation response DTOs.
- Existing accepted `ConflictException` usage in domain status transitions remains
  unchanged unless a later package explicitly changes it.

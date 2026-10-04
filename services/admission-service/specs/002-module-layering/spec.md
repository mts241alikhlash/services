# Admission Module Layering

## Goal

Convert the seven bounded contexts into explicit layered modules after the
Stage 1 split, without changing their external behavior.

## Scope

Target layout for every context:

```text
<context>/
├── <context>.module.ts
├── index.ts
├── domain/
├── application/
├── infrastructure/
└── presentation/http/
```

Migration order:

```text
wave -> announcement -> applicant -> document -> payment -> notification -> application
```

## Requirements

- Each context MUST be layered one context per slice.
- Domain repository ports and boundary types MUST stay framework-free.
- Application use cases MUST use plain inputs and MUST NOT import DTOs, Prisma,
  or `PrismaService`.
- Infrastructure MUST contain Prisma imports and adapters.
- Presentation MUST contain controllers and HTTP DTOs and MUST NOT import
  repositories or Prisma.
- Each use case MUST remain one business operation per file.
- Each context MUST expose only intentional cross-context imports through `index.ts`.
- `application/domain/policies/admission-status.transitions.ts` MUST remain the
  source of truth for application status transitions and move with `application`.
- Existing route paths, permission codes, validation, response shapes, status
  codes, search semantics, ordering, persistence behavior, and integration
  contracts MUST remain unchanged.
- The `application` context MUST be migrated last because it owns the status
  machine, enrolment handover, and highest dependency count.

## Acceptance Scenarios

- A developer can find each use case under its context's application layer.
- Domain and application compile without Prisma or HTTP DTO imports.
- Existing route and module boot tests pass after every context migration.
- The application status policy remains covered by its existing tests.
- Full validation passes after all seven contexts are layered.

## Success Criteria

- Seven contexts have the target four-layer layout.
- No stale flat-layout imports remain.
- All existing tests pass, plus focused seam tests for moved boundaries.
- `pnpm run validate` passes.

## Assumptions

- Stage 1 is complete before this package starts.
- Temporary cross-context repository coupling is resolved through public APIs,
  not copied models or direct internals.

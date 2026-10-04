# Admission Module Layering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute one context per task with review after every context.

**Goal:** Convert the seven Stage 1 contexts into layered modules while preserving behavior.

**Architecture:** Each context owns domain contracts, application use cases, infrastructure adapters, and presentation HTTP code. Cross-context consumers use explicit public APIs. `application` is last.

**Tech Stack:** NestJS 12, TypeScript 5.9, Prisma 7, Jest 30, NodeNext ESM, pnpm.

**Spec:** `specs/002-module-layering/spec.md`

## Global Constraints

- Dependency flow: `presentation -> application -> domain`; `infrastructure -> domain`.
- Application/domain do not import Prisma or DTOs.
- Presentation does not import repository or Prisma internals.
- One use case per file; plain inputs only.
- Preserve external behavior and existing integration contracts.
- Migrate in order `wave`, `announcement`, `applicant`, `document`, `payment`, `notification`, `application`.
- No new dependency, endpoint, migration, event, or compatibility alias.

## Task Sequence

### Task 1: Layer `wave`

Move port/types to `domain/repositories/`, use cases to `application/use-cases/<name>/`, Prisma adapter to `infrastructure/persistence/prisma/`, controller/DTOs to `presentation/http/`, and create public `index.ts`. Add inputs for DTO-taking cases. Fix root module imports. Run focused tests, typecheck, lint, strict lint, boot test.

### Task 2: Layer `announcement`

Repeat the same seam move for announcement. Preserve `notifyScope` and publication behavior. Expose only required public use cases/types. Run announcement tests and all slice gates.

### Task 3: Layer `applicant`

Layer applicant registration and self-service flow. Keep account provisioning, reference lookup, and current applicant repository behavior. Move serializers to presentation response DTOs only where source shape requires it. Run applicant tests and gates.

### Task 4: Layer `document`

Layer document upload and verification. Keep storage and broad repository calls until a narrow port can be proven safe. Run workflow document tests and gates.

### Task 5: Layer `payment`

Layer payment proof upload and verification. Preserve payment status and storage behavior. Run payment workflow tests and gates.

### Task 6: Layer `notification`

Layer notification reads/updates and notification service. Define public notification operation used by applicant/application/announcement contexts. Preserve ownership/read semantics. Run notification tests and gates.

### Task 7: Layer `application`

Layer application last. Move `admission-status.transitions.ts` to `domain/policies/`, keep enrolment rules in domain policies, add plain inputs, isolate integration ports, and preserve current enrolment behavior. Saga changes belong only to Package 3. Run workflow/stats tests and all gates.

### Task 8: Final layering verification

Run dependency searches, stale-path scans, focused tests, full test, format check,
lint, strict lint, typecheck, build, and validate. Write `final-verification.md`.

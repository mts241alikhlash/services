# Admission Bounded-Context Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan task-by-task with review after every slice.

**Goal:** Split flat `src/admission/` into seven concept-based context folders without changing behavior.

**Architecture:** Move files by aggregate ownership first. Keep each context internally flat and keep `AdmissionModule` as composition root. Layering and repository redesign happen in Package 2.

**Tech Stack:** NestJS 12, TypeScript 5.9, Prisma 7, Jest 30, NodeNext ESM, pnpm.

**Spec:** `specs/001-bounded-context-split/spec.md`

## Global Constraints

- Stage 1 MUST change paths and imports only.
- Preserve routes, permissions, DTO validation, status codes, response shapes, repository behavior, and integrations.
- Move contexts in order: `wave`, `announcement`, `applicant`, `document`, `payment`, `notification`, `application`.
- Keep root `AdmissionModule` as composition root.
- No new dependencies, endpoints, migrations, events, or compatibility aliases.
- Git commit checkpoints are required by design but cannot be created because workspace has no Git metadata.

## File Map

| Context | Primary files to move |
|---|---|
| `wave` | wave entity, wave port, Prisma wave adapter, six wave use cases including `GetActiveWavesUseCase`, `admission-wave-ids.dto.ts` and other wave DTOs/specs, wave controller references |
| `announcement` | announcement entity, port, Prisma adapter, six announcement use cases, announcement DTOs/specs, announcement controller references |
| `applicant` | applicant entity/port/adapter, registration and applicant use cases, applicant DTOs/specs/controller references |
| `document` | document/file entities, upload/verify use cases and DTOs/spec coverage; preserve broad repository calls |
| `payment` | payment/file entities, upload/verify use cases and DTOs/spec coverage |
| `notification` | notification service/use cases and DTO-free notification routes/specs |
| `application` | application entities, status policy/rules, application port/adapter, workflow use cases/specs, application DTOs/controller references |

## Task Sequence

### Task 1: Preflight inventory

Record current source file ownership, direct imports, route metadata, focused test commands, and Git limitation in `specs/001-bounded-context-split/preflight.md`. Run baseline `pnpm run typecheck`, focused admission tests, boot test, and `pnpm run validate`. Stop if baseline fails.

### Task 2: Move `wave`

Create `src/admission/wave/`. Move wave-owned files with `git mv` when Git exists, otherwise filesystem move plus a manifest. Fix only relative imports and root module paths. Run typecheck, wave specs, route tests, boot test. Record `wave` checkpoint report.

### Task 3: Move `announcement`

Create `src/admission/announcement/`. Move announcement entity, port, adapter, use cases, DTOs, specs, and controller references. Preserve `notifyScope` behavior. Run focused announcement specs, typecheck, route tests, boot test. Record checkpoint.

### Task 4: Move `applicant`

Create `src/admission/applicant/`. Move applicant entity, port, adapter, registration/application self-service use cases, request DTOs, specs, and controller references. Preserve account provisioning and reference lookup calls. Run applicant specs, typecheck, route tests, boot test. Record checkpoint.

### Task 5: Move `document`

Create `src/admission/document/`. Move document/file entities, upload and verification use cases, DTOs, and existing workflow spec coverage. Preserve storage calls and broad repository calls. Run document-related specs, typecheck, route tests, boot test. Record checkpoint.

### Task 6: Move `payment`

Create `src/admission/payment/`. Move payment/file entities, upload and verification use cases, DTOs, and existing workflow spec coverage. Preserve storage and payment state behavior. Run payment-related specs, typecheck, route tests, boot test. Record checkpoint.

### Task 7: Move `notification`

Create `src/admission/notification/`. Move notification service/use cases and notification specs/controller references. Preserve notification creation and read ownership behavior. Run notification specs, typecheck, route tests, boot test. Record checkpoint.

### Task 8: Move `application`

Create `src/admission/application/`. Move application entities, parent entity, status policy, enrolment rules, repository port/adapter, workflow use cases/specs, and DTO references. Preserve current `ACCEPTED -> ENROLLED` behavior for this package; Package 3 changes it. Run application workflow and stats specs, typecheck, route tests, boot test. Record checkpoint.

### Task 9: Stage 1 final sweep

Search for stale root paths and verify each moved file has one owner. Run focused suites, full `pnpm test`, `pnpm run validate`, and build. Write `final-verification.md`. Do not start Package 2 until all checks pass.

## Integration Checkpoints

Required commit messages when Git metadata becomes available:

```text
refactor(admission): split wave context
refactor(admission): split announcement context
refactor(admission): split applicant context
refactor(admission): split document context
refactor(admission): split payment context
refactor(admission): split notification context
refactor(admission): split application context
```

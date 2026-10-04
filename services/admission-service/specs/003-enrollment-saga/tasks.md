# Tasks: Admission Enrollment Saga

- [X] T001 Inspect admission/student schemas, migrations, ports, adapters, DTOs, and current enrolment tests; write `preflight.md` with idempotency constraint decision and no code changes.
- [X] T002 [P] Write failing admission state-machine tests for `ACCEPTED -> ENROLLING`, retryable `ENROLLING`, terminal `ENROLLED`, and invalid transitions in the existing workflow/rules spec files.
- [X] T003 [P] Write failing student idempotency tests for repeated same-user requests, concurrent duplicate attempts, existing student return, and NIS/NISN conflicts in `enrol-existing-account.use-case.spec.ts`.
- [X] T004 Add `ENROLLING` to admission domain status types, transition policy, Prisma enum/schema, and migration only if preflight confirms it is required; run the state-machine tests.
- [X] T005 Change admission repository port/adapter to persist `ENROLLING` and complete `ENROLLED` with `enrolledStudentId`; preserve existing reads and not-found behavior.
- [X] T006 Change `EnrollApplicantUseCase` to persist `ENROLLING` before remote enrolment, retry from `ENROLLING`, persist `ENROLLED` after remote success, and notify only after local success; run failing admission tests until green.
- [X] T007 Add additive `applicationId` contract field only if T001 proves it is needed; update admission integration port/adapter and student request DTO with contract tests.
- [X] T008 Implement the smallest atomic student-side idempotency guard justified by T001-T003; add schema/migration only when required; run repeated and concurrent tests.
- [X] T009 Add regression tests proving remote success plus local admission failure can retry without duplicate student, role, or active enrolment.
- [X] T010 Run admission focused saga tests, `pnpm run typecheck`, `pnpm run lint`, `pnpm run lint:strict`, build, and validate.
- [X] T011 Run student focused enrolment tests, `pnpm run typecheck`, `pnpm run lint`, `pnpm run lint:strict`, build, and validate.
- [X] T012 Review both service contracts and write `final-verification.md` with state transitions, idempotency evidence, migration status, and any Git/worktree limitations.

## Dependencies

```text
T001 -> T002 -> T004 -> T005 -> T006 -> T009 -> T010
T001 -> T003 -> T008 -> T009 -> T011
T001 -> T007 -> T008
T010 -> T011 -> T012
```

## MVP

T001-T006 proves admission state safety. Full saga requires T001-T012.

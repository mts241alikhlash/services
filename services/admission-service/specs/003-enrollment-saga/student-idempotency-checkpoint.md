# Student Idempotency Checkpoint

## Design

- `applicationId` is additive and optional in the admission-to-student request.
  Admission forwards the existing application row ID. Student accepts and
  carries it through its input and repository port, but does not persist it.
- No migration or operation table was added. `Student.userId` is already
  unconditionally unique, and `StudentEnrollment(studentId, semesterId)` is
  already unique for non-deleted rows.
- Student keeps the existing read-first path. If the atomic transaction loses
  the `Student.userId` unique race (`P2002`), repository code reads the winner
  by `userId` and returns the existing response shape. Other unique errors are
  rethrown, preserving NIS, NISN, parent, and active-enrolment conflict
  behavior.
- Repeated role assignment remains delegated to identity-service's existing
  `UserRole` upsert. No role table or coordination was added here.
- Admission orchestration and response fields remain unchanged. The remote
  success/local admission failure retry test proves `ENROLLING` retry calls
  student again and completes without a second student or active enrolment.

## Files

- `admission-service/src/admission/application/infrastructure/integration/student-enrolment.port.ts`
  - optional `applicationId` request field.
- `admission-service/src/admission/application/application/use-cases/enroll-applicant/enroll-applicant.use-case.ts`
  - forwards `application.id`.
- `admission-service/src/admission/application/infrastructure/integration/http-student-enrolment.adapter.ts`
  - unchanged serializer; JSON serialization forwards additive field.
- `student-service/src/student/presentation/http/dto/request/enrol-existing-account.dto.ts`
  - optional UUID field.
- `student-service/src/student/application/use-cases/enrol-existing-account/enrol-existing-account.input.ts`
  - optional application input field.
- `student-service/src/student/domain/repositories/student.repository.ts`
  - optional repository input field.
- `student-service/src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.ts`
  - forwards application ID.
- `student-service/src/student/infrastructure/persistence/prisma/prisma-student.repository.ts`
  - catches only user-key `P2002`, then reads the winning student.
- `admission-service/src/admission/application/infrastructure/integration/http-student-enrolment.adapter.spec.ts`
  - contract forwarding and unchanged result assertion.
- `admission-service/src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts`
  - application ID forwarding and remote-success/local-failure retry.
- `student-service/src/student/infrastructure/persistence/prisma/prisma-student.repository.enrol.spec.ts`
  - user race recovery and unrelated unique-conflict preservation.
- `student-service/src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.spec.ts`
  - existing RED repeated-request contract assertions now GREEN.

## Concurrency Evidence

- Existing schema constraints:
  - `prisma/student.prisma`: `Student.userId @unique`.
  - `prisma/enrollment.prisma`: partial unique
    `[studentId, semesterId]` for non-deleted enrolments.
  - identity-service `UserRole` uses composite-key upsert, confirmed by T001
    preflight.
- New repository test forces the transaction's student create to lose a
  `P2002` user-key race. It passes only when code rereads and returns the
  committed winner.
- New repository test forces a NIS unique conflict with no user winner. It
  passes only when code rethrows the original conflict.
- Existing repeated-request test confirms both calls carry the same
  `applicationId` and converge on one `studentId` through repository behavior.
- Retry regression calls remote enrolment twice after local admission mark
  failure. Second remote result is `alreadyEnrolled: true`; admission marks
  `ENROLLED` once successfully and sends one notification.
- No migration was required. Existing uniqueness is sufficient for one stable
  admission operation per user. A persisted operation record is still the
  upgrade point if one user must support multiple distinct enrolment
  operations.

## RED/GREEN Commands

RED before production changes:

```text
admission-service:
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/admission/application/infrastructure/integration/http-student-enrolment.adapter.spec.ts src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts
# 2 failed tests: missing applicationId in forwarded request

student-service:
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.spec.ts src/student/infrastructure/persistence/prisma/prisma-student.repository.enrol.spec.ts
# 3 failed tests: missing applicationId propagation and uncaught user-key P2002
```

GREEN after production changes:

```text
admission-service:
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/admission/application/infrastructure/integration/http-student-enrolment.adapter.spec.ts src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts
# 2 suites passed, 13 tests passed

student-service:
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.spec.ts src/student/infrastructure/persistence/prisma/prisma-student.repository.enrol.spec.ts
# 2 suites passed, 7 tests passed
```

Required full verification commands and results are appended after execution.

## Final Verification

Student focused tests:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/student/application/use-cases/enrol-existing-account/enrol-existing-account.use-case.spec.ts src/student/infrastructure/persistence/prisma/prisma-student.repository.enrol.spec.ts src/enrollment/application/use-cases/ensure-student-enrollment/ensure-student-enrollment.use-case.spec.ts
# 3 suites passed, 14 tests passed
```

Admission focused tests:

```text
pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --runTestsByPath src/admission/application/infrastructure/integration/http-student-enrolment.adapter.spec.ts src/admission/application/application/use-cases/admission-workflow.use-cases.spec.ts src/admission/application/domain/policies/enroll-as-student.rules.spec.ts
# 3 suites passed, 31 tests passed
```

Student full validation:

```text
pnpm run validate
# format:check passed
# lint passed
# typecheck passed
# lint:strict passed
# 63 suites passed, 392 tests passed
# build passed
```

Admission full validation:

```text
pnpm run validate
# format:check passed
# lint passed
# typecheck passed
# lint:strict passed
# 24 suites passed, 153 tests passed
# build passed
```

No Git commit was created. No student migration was added. T007, T008, and
T009 are marked complete in `admission-service/specs/003-enrollment-saga/tasks.md`.

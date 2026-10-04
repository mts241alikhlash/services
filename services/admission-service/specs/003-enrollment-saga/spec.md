# Admission Enrollment Saga

## Goal

Make accepted-applicant enrolment retry-safe across admission-service and
student-service when the remote student creation succeeds but the local
application update fails.

## State Machine

```text
ACCEPTED -> ENROLLING -> ENROLLED
```

Remote or local failure leaves the application in `ENROLLING`. A retry reads
that state and resumes the remote idempotent operation instead of creating a
second student.

## Requirements

- The admission application status MUST support `ENROLLING`.
- Only `ACCEPTED` may enter `ENROLLING`.
- `ENROLLING` MUST be retryable.
- `ENROLLED` MUST remain terminal for enrolment.
- Admission MUST persist `ENROLLING` before calling student-service.
- Admission MUST persist `ENROLLED` only after student-service returns success.
- Admission MUST persist the returned `studentId` with the enrolled state.
- Student-service MUST make the enrolment operation idempotent for repeated
  requests for the same admission operation and user.
- A retry after remote success and local failure MUST return the existing student
  and MUST NOT create a second student, duplicate role, or duplicate enrolment.
- Student-service MUST preserve existing NIS/NISN conflict behavior.
- Existing HTTP response fields remain compatible. Any new idempotency key is
  additive and documented in the cross-service contract.
- Notifications MUST be sent only after local `ENROLLED` persistence succeeds.
- Failure and retry behavior MUST have automated tests in both services.

## Acceptance Scenarios

### Scenario 1: Begin enrolment

Given an application is `ACCEPTED`, when enrolment starts, then it becomes
`ENROLLING` before the remote request is sent.

### Scenario 2: Remote failure

Given an application is `ENROLLING`, when student-service rejects or cannot be
reached, then the application remains `ENROLLING` and no local `ENROLLED` or
success notification is written.

### Scenario 3: Local write failure

Given student-service created the student but local status persistence fails,
when the operator retries, then student-service returns the existing student and
admission completes the local transition to `ENROLLED` without duplication.

### Scenario 4: Completed application

Given an application is `ENROLLED`, when enrolment is requested again, then the
operation does not create or mutate another student.

### Scenario 5: Concurrent retry

Given two retries for one application arrive together, when both reach
student-service, then at most one student and one active enrolment exist.

## Success Criteria

- No duplicate student is created across any tested retry sequence.
- Every failed post-remote local write remains visible as `ENROLLING`.
- Successful retries converge to `ENROLLED` with the correct student ID.
- Existing NIS/NISN conflict tests remain green.
- Admission and student full validation commands pass.

## Assumptions

- `userId` remains a stable identity key and existing student lookup remains
  available.
- A request idempotency key based on `applicationId` is the preferred explicit
  key; `userId` remains a defensive uniqueness constraint.
- No event broker is introduced. The saga remains a direct awaited HTTP flow.

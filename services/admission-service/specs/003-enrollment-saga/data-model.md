# Data Model: Enrollment Saga

## AdmissionApplication

Existing fields remain. Add only the state required for the saga:

- `status`: add `ENROLLING` between `ACCEPTED` and `ENROLLED`
- `enrolledStudentId`: existing field, populated on successful completion

No new table is required for the minimum saga. If implementation discovery
shows that concurrent idempotency needs a persisted operation record, that change
requires an explicit follow-up decision and migration task.

## State transitions

```text
ACCEPTED -> ENROLLING
ENROLLING -> ENROLLING   # retryable failure
ENROLLING -> ENROLLED    # remote success + local success
ENROLLED -> terminal
```

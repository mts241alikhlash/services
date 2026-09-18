# Research: Admission Enrollment Saga

## Current Flow

Admission calls `POST /students/enrol`, then writes its own application as
`ENROLLED`. Student-service already checks `findByUserId()` and returns an
existing student, but concurrent retries are not represented by admission state
and no explicit operation key crosses the boundary.

## Decision

Add `ENROLLING` to the admission state machine and carry an additive
`applicationId` operation key to student-service. Keep `userId` uniqueness and
existing NIS/NISN checks.

## Rationale

The local state records intent before the remote side effect. The remote side
uses both stable user identity and explicit operation identity, while the local
final write records the returned student. This makes the failure window visible
and retryable without a distributed transaction.

## Rejected Alternatives

- Distributed transaction: unavailable across service databases and increases
  failure coupling.
- Fire-and-forget event: violates the service constitution's direct awaited
  consequence rule.
- User ID only: existing behavior helps sequential retries but does not clearly
  identify one admission operation during concurrent retries.

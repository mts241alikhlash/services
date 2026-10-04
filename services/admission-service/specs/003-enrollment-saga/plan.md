# Admission Enrollment Saga Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development with TDD and cross-service review.

**Goal:** Make admission enrolment explicitly retryable and idempotent across admission-service and student-service.

**Architecture:** Admission records `ENROLLING` before the awaited student-service call and records `ENROLLED` only after local persistence succeeds. Student-service accepts an additive operation identity and enforces idempotent repeated requests without weakening existing NIS/NISN rules.

**Tech Stack:** NestJS 12, TypeScript 5.9, Prisma 7, PostgreSQL, Jest 30, NodeNext ESM, pnpm.

**Spec:** `specs/003-enrollment-saga/spec.md`

## Global Constraints

- State flow is `ACCEPTED -> ENROLLING -> ENROLLED`.
- Notification occurs only after local `ENROLLED` persistence.
- No distributed transaction, event broker, or fire-and-forget flow.
- Existing response fields and NIS/NISN conflict behavior remain compatible.
- Verify current student database constraints before choosing a new persistence field.
- Do not add a migration until schema need is proven by concurrency tests and repository inspection.

## Task Sequence

### Task 1: Contract and constraint preflight

Inspect admission and student schemas, migrations, ports, adapters, controller DTOs, and existing tests. Record whether `applicationId` can be persisted or used as a request key without schema changes. Add failing tests for desired state transitions and retry behavior before production code.

### Task 2: Admission state machine

Add `ENROLLING` to the admission enum and transition policy. Update repository input/output types and Prisma migration only if schema is not already compatible. Test `ACCEPTED -> ENROLLING`, retryable `ENROLLING`, terminal `ENROLLED`, and invalid transitions.

### Task 3: Admission orchestration

Change enrolment use case to persist `ENROLLING` before remote call, accept retry from `ENROLLING`, preserve validation, call student-service, persist `ENROLLED` with returned student ID, and notify after success. Add failure tests for remote failure and local mark failure.

### Task 4: Student contract

Add additive `applicationId` input only if preflight proves it is needed and safe. Keep `userId` lookup and NIS/NISN checks. Update admission port/adapter and student DTO/port with no breaking field changes. Add contract tests.

### Task 5: Student idempotency

Implement atomic duplicate protection in student-service. Prefer existing unique `userId` behavior if concurrency tests prove it safe; otherwise add the smallest justified unique operation record/constraint and migration. Ensure repeated/concurrent requests return one student and do not duplicate role or enrolment.

### Task 6: Cross-service verification

Run admission focused saga tests, student focused enrolment tests, full tests, typecheck, lint, strict lint, build, and validate in both services. Record environment failures separately from product failures.

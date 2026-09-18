# admission-service

PPDB 241 — admission waves, applications, documents, payments, announcements,
and the enrolment that turns an accepted applicant into a student. NestJS +
Prisma + PostgreSQL, NodeNext ESM — relative imports carry the `.js` extension
even though the source is `.ts`.

## Authoritative docs

Four documents govern this repo, in this order of precedence:

- `docs/CONSTITUTION.md` — the platform's binding principles. Everything above
  its SERVICE PROFILE heading is shared byte-for-byte with the other five
  services; below it is this service's own profile. Where it and any other doc
  disagree, **it wins**.
- `docs/ARCHITECTURE.md` — **start here for where code goes.** Part 1 is the
  Clean Architecture layering `src/admission/` is migrating to, with the measured
  current state and the conversion procedure. Part 2 is the service boundary.
  Its two *structure* sections supersede `NESTJS-RULES.md`'s.
- `docs/CLEAN-CODE.md` — **start here for what code looks like** once it is in
  the right place, worked through this service's real files rather than generic
  placeholders.
- `docs/NESTJS-RULES.md` and `docs/IAM.md` — the exhaustive coding rules and the
  authorization model, still binding except where
  the two documents above supersede them.

`.claude/skills/` carries six skills scoped to this repo — clean-architecture,
clean-code, nestjs-best-practices, domain-driven-design, code-review,
diagnosing-bugs — pinned in `skills-lock.json`.

**Neither is committed.** `.gitignore` keeps `.claude/`, `.specify/` and
`skills-lock.json` out of this repository — they are how it is worked on, not
what it ships, and nothing reads them at build or run time. A fresh clone will
not have them; re-fetch them from their sources. `CLAUDE.md` and `docs/` are
tracked and stay the thing to read first.

## The coupling a port could not fix — and what replaced it

> **Resolved on 2026-08-30.** What follows describes the problem and the shape
> that answered it. The transaction is gone from this service.

### What it was

Eight Prisma models are admission's own. It touches **ten more that belong to
other services**, and unlike every other service here, the
reason is not a read it could replace with an HTTP call.

`PrismaAdmissionApplicationRepository.enrollAsStudent()` is **one transaction
across three services' tables**:

| Step | Table | Owned by |
|---|---|---|
| 1 | `profiles` | identity-service |
| 2 | `students` | academic-service |
| 3 | `parents`, `student_parents` | academic-service |
| 4 | `addresses` | academic-service |
| 5 | `user_roles` (grant STUDENT) | identity-service |
| 6 | `semesters` read, `student_enrollments` | academic-service |
| 7 | `admission_applications` → ENROLLED | this service |

It is atomic, and it is **right** that it is atomic. A half-enrolled child — an
account with no student record, or a student with no class — is worse than a
failed enrolment, because the first is silent and the second is not. One process
gets that for free from one database.

### What replaced it

The transaction moved to academic-service, which owns six of those eight tables,
and this service calls `POST /students/enrol` through `IStudentEnrolmentPort` —
the platform's first genuine service-to-service call. Then it makes one write of
its own: `markEnrolled`.

**Two steps, not one commit.** If the second fails, a student exists whose
application still reads ACCEPTED. That is worse than one local transaction and
better than a distributed transaction, for two reasons that have to hold together:

- it is **visible** — the operator sees an application they just processed still
  sitting in their queue;
- it is **repairable** by repeating the action, because the enrolment endpoint is
  idempotent on `userId` and returns the existing student rather than creating a
  second one.

This is the first half of the saga rather than the whole of it. What is missing
is an explicit "enrolment in progress" state; the retry is the compensation, and
it depends on an operator noticing. `admission-workflow.use-cases.spec.ts` asserts
the ordering that makes it safe: the local write happens only after the remote one
succeeds.

Four checks left with the transaction — `isNisTaken`, `isNisnTaken`,
`isNikTakenInProfiles`, `findStudentRoleId`. All four read tables this service
does not own, and all four are checks academic makes for itself. A copy here would
be two services holding separate opinions about one rule.

The second write is smaller and ordinary: registering an applicant creates their
account through `AccountProvisioningService`, with a password hashed by
`PasswordManagerService`. That one *is* a candidate for an HTTP call.

Every one of these reads and writes is concentrated in **two files** —
`prisma-admission-application.repository.ts` and
`prisma-admission-applicant.repository.ts` — and both already sit behind
repository interfaces. Whoever writes the saga starts there and nowhere else.

## The flat layout is debt, and it is not to be extended

`admission/` is a single flat module at domain level: `domain/`, `dto/`,
`infrastructure/`, `presentation/`, `services/`, `use-cases/`, with **six
controllers and thirty-one use cases** and no sub-modules. The constitution's
Compliance Baseline names this explicitly, and the rule is in root `CLAUDE.md`:

> New admission work MUST NOT extend the flat layout.

Prefer splitting along the seams the repository interfaces already mark — wave,
announcement, applicant, application — over adding a thirty-second use case to
the pile. `src/no-ignored-caller.spec.ts`'s floor comment records the count so it
is visible rather than folklore.

## Two roles resolved by name, and why that is not a bypass

This service names `APPLICANT` at registration and `STUDENT` at enrolment. Both
are structural roles that identity-service declares and protects from deletion, and
both are named in order to **grant** a role — not to decide an authorization
outcome. `src/single-role-bypass.spec.ts` is about the latter, and passes.

If either role were ever deleted, this service breaks far from where the deletion
happened. That is the cross-service guarantee recorded in identity-service's
`structural-roles.constants.ts` as `Cross-service — admission-service: …`, and
nothing checks it automatically.

## What it borrows

| Here | Why |
|---|---|
| `platform/auth` + `access-control` (19 files) + `PasswordManagerService` | applicants sign in; registration hashes a password |
| `platform/user` — `AccountProvisioningService` only | the applicant's account |
| `core/storage` | applicants upload a birth certificate, family card, payment proof |
| `core/database`'s address guard | **kept here alone.** The `$extends` on `address.create` refusing a row with no owner is this service's business: it writes the applicant's address. The other five services dropped it. |
| `platform/academic-lookup` | the three reference lists a PPDB form points at — see below |

> **`start:prod` deliberately does not run `prisma migrate deploy`.**

### The three mirrors, and what replaced them (2026-09-09)

`prisma/` declared `AcademicYear`, `Occupation` and `Education` and joined all
three. None was ever written here: a wave belongs to an academic year, an
applicant's parents name an occupation and an education level, and every one of
those lists belongs somewhere else. Declared but unowned, they would each have
become a **second copy of the table** on the first `prisma migrate`, drifting
from the original with nothing to reconcile them.

| Wanted | Now |
|---|---|
| The academic year a wave belongs to | `POST /academic-years/by-ids` → academic-service |
| A parent's occupation | `POST /occupations/by-ids` |
| A parent's education level | `POST /educations/by-ids` |

`Education` was the awkward one: admission-service and student-service both
declared it and **neither served it**. It moved to academic-service's
`reference-data/`, beside `Occupation` — the two are the same kind of list,
filled in on the same form, read by the same two services.

`Religion` stays. This service is the only one that declares the table, so it
owns it rather than mirroring it. (identity-service keeps a bare `religionId`
scalar on `Profile` with no model and no relation, which is the same pattern
one step further along.)

The ids stay on the rows as plain columns, and `AdmissionWave.academicYearId`
gained an explicit `@@index`: Prisma indexes a relation scalar as part of the
foreign key it emits, so dropping the relation drops the index, and the wave
list filters on that column. `AdmissionApplicationParent.occupationId` and
`.educationId` did not get one — nothing filters on them, they are only read
back out, and an index there would cost writes for nothing.

One rule worth keeping from this: **the reference lookups run outside the
transaction.** `updateMyApplication` writes the parents in a transaction and
attaches their occupation and education after it commits. An HTTP call inside a
transaction holds a database connection open for the round trip, which turns a
slow reference lookup into a database problem.

## Authorization no longer reads identity-service's tables

As of 2026-08-30 the access token carries the caller's `roles` and (when they
fit) `permissions`, and `PermissionGuard` reads them from `request.user` instead
of querying. Measured with `log_statement='all'` over ten authenticated
requests: `user_roles`, `role_permissions` and `permissions` were queried **zero
times**, where each request previously cost three reads into tables this service
does not own.

Two things did **not** change, and both are deliberate:

- **Session validation still reads `auth_sessions` and `users`** on every
  request. That is a different question — *is this session still live and this
  account still active* — and answering it from a token would mean a revoked
  session kept working until expiry. Revocation should be immediate.
- **The fallback is still here.** `IPermissionRepository` remains wired, because
  a token can arrive without permissions: one minted before this change, or a
  caller whose list exceeded the header budget. SUPER_ADMIN is the standing
  example — 262 grants, about 8.1KB encoded, over Nginx's default 8k buffer — and
  it never needs them, because the guard decides its bypass on the role.

So the coupling is **reduced, not removed**. Removing it entirely means capping
what one role may hold, which is a decision about how the school arranges its
administrators rather than a code change. `identity-service/src/iam/auth/types/jwt-token-payload.type.ts`
holds the measured numbers and the budget.

## The wave is resolved, not chosen

Public registration no longer accepts a `waveId`. The caller sends name, email
and password, and this service resolves the wave itself in `findActiveWave`:
`isActive = true AND deletedAt IS NULL AND startDate <= today <= endDate`,
ordered by `startDate asc`, first match wins. When no wave is open, registration
answers `400`, because there is no window to register into and a client-supplied
id must not be able to invent one. The admin on-behalf endpoint is unchanged: an
administrator registering for a family at the office still sends an explicit
`waveId` and still gets it validated.

The public DTO and the admin DTO are separate for exactly this reason. One type
with an optional `waveId` would have let a public caller pick a closed wave.

`POST /admissions/my-application/ensure` (JwtAuthGuard, no body) gives a
signed-in account its DRAFT application if it lacks one. It is **idempotent by
construction**: the existence read runs first and an existing application is
returned untouched, so calling it twice returns one registration number rather
than two. The DRAFT is seeded with empty `fullName` and `email` because this
path carries no dialog data; the applicant fills those in the form.

Both paths share one DRAFT-creation helper, so registration numbering, the
`UNPAID` payment row and the welcome notification stay in one place instead of
drifting between "register" and "ensure".

The application's wave comes back with its academic year name attached, resolved
through `resolveAcademicYearNames` on the same read, so the form can show a
locked `Gelombang Pendaftaran` field without a second call.

## Commands

```bash
pnpm install
pnpm prisma:generate
pnpm dev
pnpm validate     # format:check + lint + typecheck + lint:strict + test + build
```

`JWT_SECRET` must be byte-identical to identity-service's.

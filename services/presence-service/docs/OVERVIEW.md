# presence-service

241 Presence — who was at the gate, and when. Credentials, devices, scans, one
daily row per person per day, leave, and the monthly period that closes it.
NestJS + Prisma + PostgreSQL, NodeNext ESM — relative imports carry the `.js`
extension even though the source is `.ts`.

## This service does not know what a teacher is

Every model here keys on `userId`. Not on `Student`, not on `Teacher`. The one
place the distinction exists at all is a two-value enum,
`PresenceSubjectType { STUDENT, EMPLOYEE }`, carried on a credential and a
daily row so a recap can be filtered — never branched on for behaviour.

That was ADR-0007's deliberate choice and it is the reason this is the cleanest
data boundary of the nine services. It is also what makes the next thing cheap.

### Students at the gate need almost no new machinery

RFID or QR for students is the same credential, the same device, the same scan,
the same daily row. `POST /presence/credentials` already accepts
`subjectType: 'STUDENT'`; `PresenceScan` resolves a code to a `userId` and
knows nothing else about the person. What is missing is a screen to issue and
print student cards and a place to show a student recap — frontend work, in
`academic-web` where students live, not a schema change here.

## Payroll left on 2026-09-10

Payroll lived here from 2026-08-30 to 2026-09-10 — extracted as its own service
on 2026-08-29, merged in the next day, and moved out again to `hr-service` ten
days later. The merge was right at the time and the move out is right now,
for a reason the merge did not have.

**Students.** Once student gate attendance lands in these tables, this database
holds children's daily movements. An employee's salary must not live in the
same database. That is a data-protection boundary; module hygiene inside one
deployable does not satisfy it.

The three costs the 2026-08-30 merge was avoiding were all paid off before the
move rather than paid again:

| The 2026-08-29 cost | Why it does not recur |
|---|---|
| A **verbatim copy** of `summariseMonth` in payroll's read port | `POST /daily-presences/monthly-summary` serves that arithmetic. assessment-service has consumed it since 2026-09-09; hr-service is the second consumer. There is one implementation. |
| Three cross-service edges, two of them to presence | Two, both to presence. The roster edge disappeared entirely — payroll now sits beside the employment record it reads. |
| Two independence guards cut in half | Zero. Both FR-055/FR-056 sweeps live in hr-service now, in one repository, where neither can be deleted without the other turning red. |
| No frontend of its own | `hr-web` is hr-service's frontend, exactly. |

The copy is the one that mattered. It was kept verbatim in 2026-08-29 because a
rewrite had got four things wrong — `LATE` counting as a present day,
`lateCount` keying on status rather than minutes, `lateMinutes` accumulating
unconditionally, and the month bounded `lte` rather than `lt`. None would have
failed a build; all four would have produced payslips that were quietly,
slightly wrong.

`payroll-roster-independence.spec.ts` and
`test/payroll-authorization.e2e-spec.ts` went with it.
`src/presence/presence-roster-independence.spec.ts` stays and now scans
`src/presence` alone — the only root left here.

## Database — its own

`prisma/` declares **14 models**, every one of them this service's:

`PresenceCredential`, `PresenceDevice`, `PresenceScan`, `DailyPresence`,
`PresenceCorrection`, `WorkPattern`, `WorkPatternDay`, `WorkPatternAssignment`,
`NonWorkingDay`, `LeaveType`, `LeaveRequest`, `LeaveDay`, `LeaveBalance`,
`AttendancePeriod`.

It declared 19 until payroll left; `Teacher` had gone earlier, on 2026-09-09,
when the roster became an HTTP call. Nothing here reads another service's
tables through Prisma — no `prisma.x` call, no relation include, no relation
`where`, no `orderBy` through a relation, no `_count.select`.

The init migration under `prisma/migrations/20260904000000_init/` was
regenerated on 2026-09-10 when payroll left, offline, without a database:

```bash
pnpm exec prisma migrate diff --from-empty --to-schema prisma --script > prisma/migrations/20260904000000_init/migration.sql
```

It creates all fourteen tables and contains no foreign key to a table another
service owns. `prisma:migrate` and `prisma:deploy` both ship, and are safe to
run: `DATABASE_URL` points at `presence_service`, which nothing else writes.

**The regenerated migration drops five tables from what the previous one
created** — `salary_components`, `salary_assignments`, `payroll_runs`,
`payslips`, `payslip_lines`. It has never been deployed, so there is nothing
to migrate away from; a box that did apply the old one gets a checksum error
rather than a silent divergence, which is the accurate thing to be told.

## Who reads from here

Three services ask, all through `@Public()` + `ProvisioningTokenGuard`:

| Route | Asked by | For |
|---|---|---|
| `POST /daily-presences/monthly-summary` | hr-service, assessment-service | a payslip's attendance driver; a teacher's monthly recap |
| `POST /daily-presences/by-users` | assessment-service | pre-filling a class register from the gate |
| `GET /presence/periods/:year/:month/closed` | hr-service | payroll refuses to run against an open month |

The last one was added on 2026-09-10 for the payroll move. A scan recorded
after a payslip is issued would change a payslip already issued, so the month
has to be closed first, and only this service knows whether it is.

The direction is one-way and must stay so. `presence-academic-direction.spec.ts`
enforces it (ADR-0007): a cycle here is not a style complaint — NestJS resolves
an import cycle by handing a module `undefined` at boot, which is a crash
rather than a warning.

## What it asks for

Only identity-service, and only the calls every service makes:
`POST /auth/introspect` for liveness and grants, `POST /profiles/batch` for the
name beside a scan, and `POST /audit-logs`.

Authorization touches none of identity-service's tables. `platform/identity`'s
`HttpIdentityAdapter` asks `POST /auth/introspect` and gets liveness *and*
grants back in one answer. The trade is worth stating plainly, because it is
the price of a separate database rather than a free win:

- **Revocation is bounded, not instant.** The answer is cached for
  `IDENTITY_CACHE_TTL_MS` (5s default, 0 disables), so a revoked session keeps
  working for up to that window. Short enough that "revoked" still means what
  an operator expects; long enough to collapse a screen's worth of parallel
  requests into one call.
- **identity-service is a hard dependency of every authenticated request,** not
  just of sign-in. The adapter fails closed with a 503 rather than a 401 — 401
  sends an operator to check their password, 503 says the platform is degraded
  — and sheds load past `IDENTITY_MAX_CONCURRENT_REQUESTS` rather than queueing
  behind a struggling upstream.

That slice is byte-identical in all eight non-identity services. Change it here
and it must be changed in all of them.

## Authoritative docs

Four documents govern this repo, in this order of precedence:

- `docs/CONSTITUTION.md` — the platform's binding principles. Everything above
  its SERVICE PROFILE heading is shared byte-for-byte with the other services;
  below it is this service's own profile. Where it and any other doc disagree,
  **it wins**.
- `docs/ARCHITECTURE.md` — where code goes. Part 1 is the Clean Architecture
  layering `src/presence/` is migrating to, with the measured current state and
  the conversion procedure. Part 2 is the service boundary. Its two *structure*
  sections supersede `NESTJS-RULES.md`'s.
- `docs/CLEAN-CODE.md` — what code looks like once it is in the right place,
  worked through this service's real files.
- `docs/NESTJS-RULES.md` and `docs/IAM.md` — the exhaustive coding rules and
  the authorization model, still binding except
  where the two documents above supersede them.

`.claude/`, `.specify/` and `skills-lock.json` are **not committed** — they are
how this repo is worked on, not what it ships, and nothing reads them at build
or run time. A fresh clone will not have them.

## Commands

```bash
pnpm install
pnpm prisma:generate
pnpm dev                      # :3400
pnpm run validate             # format:check + lint + typecheck + lint:strict + test + build
```

`JWT_SECRET` and `PROVISIONING_SERVICE_TOKEN` must be byte-identical to
identity-service's. `FRONTEND_URL` carries two origins — `hr-web` on :5177,
and `academic-web` on :5173 for the student attendance screens to come.

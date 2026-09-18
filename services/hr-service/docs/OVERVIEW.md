# hr-service

241 HR — the people who work at the school, and what they are paid: staff
records, structural positions, employment types, and payroll. NestJS + Prisma +
PostgreSQL, NodeNext ESM — relative imports carry the `.js` extension even
though the source is `.ts`.

## Where it came from

Two moves, not one.

The employee half was extracted from `academic-service`'s `teacher` and
`reference-data/{employment-type,position,position-category}` modules on
2026-09-03, by copying — the same Strangler Fig move academic-service itself
was extracted with. It was called `employee-service` then.

The payroll half arrived from `presence-service` on **2026-09-10**, when the
service was renamed. That move is the one worth understanding, because it
reverses a decision taken on 2026-08-30.

### Why payroll moved, when it had been merged into presence before

Payroll was its own service for one day — extracted 2026-08-29, merged into
presence-service 2026-08-30 — and the merge was right at the time. The split
had bought nothing and cost three things: eighteen routes with no frontend of
its own, three cross-service edges of which two went to presence, and two
independence guards cut in half.

The new fact is **students**. Gate attendance is going to cover students as
well as staff — RFID and QR at the gate, the same `presence_scans` and
`daily_presences` rows, because every presence model keys on `userId` and knows
nothing about whether that user is a teacher or a child. Once presence holds
student data, an employee's salary must not sit in the same database as a
child's arrival time. That is a data-protection boundary, not a layering
preference, and no amount of module hygiene inside one deployable satisfies it.

So the split ran again, in the other direction: payroll went to the service
that already held the employment record, and presence stayed person-agnostic.

**The 2026-08-30 arithmetic no longer applies:**

| | payroll split off presence (2026-08-29) | payroll joined to HR (2026-09-10) |
|---|---|---|
| Cross-service edges | 3, two of them to presence | 2, both to presence |
| The roster | an HTTP call to employee-service | in process — the staff record is here |
| `summariseMonth` | a **verbatim copy** of presence's arithmetic | `POST /daily-presences/monthly-summary`, served |
| Guards cut in half | 2 | **0** — both now live in this repo |
| Frontend of its own | none | 241 HR (`hr-web`) is exactly this service's frontend |

The copy is the one that mattered. The 2026-08-29 split shipped a duplicate of
presence's monthly arithmetic because an earlier rewrite had got four things
wrong — `LATE` counting as a present day, `lateCount` keying on status rather
than minutes, `lateMinutes` accumulating unconditionally, and the month bounded
`lte` rather than `lt`. None would have failed a build; all four would have
produced payslips that were quietly, slightly wrong. **There is no copy this
time.** presence-service serves that arithmetic at
`POST /daily-presences/monthly-summary`, and has done since 2026-09-09, when
assessment-service became its first consumer.

## What this service owns

| Folder | What |
|---|---|
| `src/employee/` | the employee record — NIP, NUPTK, hire date, addresses, the account behind the person |
| `src/reference-data/{employment-type,position,position-category}/` | the code tables a staff record points at |
| `src/payroll/{component,assignment,run,payslip}/` | salary components, per-person assignments, monthly runs, payslips |

`Employee` is an **employment** record, not a teaching one. Who teaches which
subject to which class in which semester is `TeachingAssignment` and
`ClassroomSupervisor`, both in academic-service, both per-semester.

**It was called `Teacher` until 2026-09-11.** The split was always right; only
the name was wrong, and it kept a non-teaching staff member — an admin, a TU
clerk — out of a table they belong in. The rename went through the database
(`employees`, `employee_positions`), the folder, the routes
(`/employees`, `/employee-positions`), the `employees.*` permission codes, and
every caller. **"Guru" is a `Position`**, which is how the code already worked:
`isTeachingStaff()` checks `position.category.code === 'ACADEMIC'`.

`employment-type`, `position` and `position-category` sit in
`reference-data/`: plain `{id, name, isActive}` code tables. The governed
record of a person's employment is a different thing with its own lifecycle,
and it lives in `employee/`.

## Database — its own

`prisma/` declares **10 models** in its own database (`hr_service`):

`Employee`, `EmployeePosition`, `Position`, `PositionCategory`,
`EmploymentType`, `SalaryComponent`, `SalaryAssignment`, `PayrollRun`,
`Payslip`, `PayslipLine`.

**`Address` is gone, and was dead before it went.**
`ITeacherAddressRepository` had full CRUD, was provided and exported, and was
called by no use case; the rows were read into a Prisma include and never
reached a response DTO. A person's address is identity-service's now — see the
workspace `docs/OVERVIEW.md`.

Nothing here reads another service's tables through Prisma — no `prisma.x`
call, no relation include, no relation `where`, no `orderBy` through a
relation, no `_count.select`.

The init migration under `prisma/migrations/20260904000000_init/` was
regenerated on 2026-09-10 when payroll arrived, offline, without a database:

```bash
pnpm exec prisma migrate diff --from-empty --to-schema prisma --script > prisma/migrations/20260904000000_init/migration.sql
```

It creates all eleven tables and contains no foreign key to a table another
service owns. `prisma:migrate` and `prisma:deploy` both ship, and are safe to
run: `DATABASE_URL` points at `hr_service`, which nothing else writes. The
database was called `employee_service` until 2026-09-10 and was renamed with
the service — it had never been migrated, so nothing had to be moved.

Six academic-era seed scripts (`seed-timetable.ts`, `seed-school-life.ts`,
`prisma/seeds/`) came along with the 2026-09-03 extraction and were **deleted
on 2026-09-10**. Nothing referenced them, no `package.json` script ran them,
and every one reached for a model this service does not declare — `occupation`,
`student`, `achievementType`. `prisma/` is excluded from `tsconfig.json`, so
they would never have turned a build red.

## What it asks other services

All go through `platform/service-client`, carry `x-provisioning-token`, and
fail closed with a 503.

| Wanted | Asked of | Route |
|---|---|---|
| Which teachers taught or supervised in academic year X | academic-service | `GET /teaching-assignments/employee-ids?academicYearId=` |
| A person's attendance for a payroll month | presence-service | `POST /daily-presences/monthly-summary` |
| Whether the attendance month is closed | presence-service | `GET /presence/periods/:year/:month/closed` |

Plus the calls every service makes: `POST /auth/introspect` and
`POST /profiles/batch` to identity-service, `POST /accounts` for the account
behind a staff member, and `POST /audit-logs`.

The first replaced a relation `where` out of `employees` into
`teaching_assignments` and `classroom_supervisors` — both academic-service's —
and it is the only reason this schema ever declared `Semester`,
`TeachingAssignment` and `ClassroomSupervisor`. All three are gone. A year in
which nobody taught matches nobody, exactly as the join did.

The last one is new on 2026-09-10 and exists so payroll can refuse to run
against an open month: a scan recorded afterwards would change a payslip
already issued.

## What this service answers for others

All four go through `EmployeeInternalController`, `@Public()` +
`ProvisioningTokenGuard` — the caller is a backend, not a signed-in person:

| Route | Asked by | For |
|---|---|---|
| `GET /employees/roster` | nothing, today | see below |
| `GET /employees/by-user/:userId` | academic, assessment | `/me` routes |
| `GET /employees/:id/exists` | academic, student | before naming a homeroom teacher |
| `POST /employees/by-ids` | academic-service | a name and NIP beside a timetable, a subject, a class |

`POST /employees/by-ids` returns three fields — `id`, `userId`, `nip` — and no
more. `userId` is how the caller resolves the name against identity-service, so
a field added to `Employee` here cannot change what any caller reads.

**`GET /employees/roster` has no remote caller any more.** It was added on
2026-09-09 for presence-service's payroll; payroll is now in this process and
reads the roster through `IEmployeeIdentityReadPort` directly. The route is kept
because the guard below is written against it, but nothing across the network
asks for it today.

Two properties of it are still load-bearing:

- **It is registered first in `EmployeeModule`.** `EmployeeController` declares
  `@Get(':id')` and Nest matches controllers in registration order, so a
  `roster` route behind it would be read as an employee id.
- **It does not filter by position, position category, or employment type**
  (FR-055, FR-056). A position the school adds next year must work the day
  someone is assigned to it, with no deploy.

## The independence guard is whole again, in one repository

Two sweeps enforce FR-055/FR-056, and as of 2026-09-10 **both are here**:

- `src/employee/domain/repositories/employee-identity-read.port.spec.ts` — the
  roster query itself applies no position.
- `src/payroll/payroll-roster-independence.spec.ts` — nothing under
  `src/payroll` reads `position`, `positionCategory`, `employeePosition` or
  `employmentType`, or compares against a seeded code (`KEPALA_SEKOLAH`,
  `GURU_MAPEL`, `PNS`, `GTY`, and the rest). Its positive half follows the
  query into `integration/local-payroll-roster.adapter.ts`: the roster may
  narrow by "active" and by nothing else.

While the roster was an HTTP call the two halves lived in repositories that
could not see each other, and deleting either one silently halved the rule.
That failure mode is gone.

## Commands

```bash
pnpm install
pnpm prisma:generate          # required before anything else
pnpm dev                      # :3800
pnpm run validate             # format:check + lint + typecheck + lint:strict + test + build
```

`JWT_SECRET` and `PROVISIONING_SERVICE_TOKEN` must be byte-identical to
identity-service's. `FRONTEND_URL` carries two origins — `hr-web` on :5177 and
`academic-web` on :5173, which reads `/employees` for its teacher pickers.

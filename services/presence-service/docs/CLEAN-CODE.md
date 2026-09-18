# CLEAN CODE

How one file, inside an already-correctly-placed module, should look. This is
the companion to `ARCHITECTURE.md`, not a replacement for it:

- `ARCHITECTURE.md` — where a piece of code lives (folders, layers, service
  boundary).
- `CLEAN-CODE.md` (here) — what that piece of code looks like once it is in the
  right place.
- `NESTJS-RULES.md` — the exhaustive rule list. This
  document is a grounded walk through the parts of it that come up constantly,
  worked through `attendance-period`, `daily-record` and `payroll/integration`
  as real files rather than the generic placeholders there. Where the two
  disagree, `NESTJS-RULES.md` wins — say so and ask.

Every code sample below is real code from this repo as of 2026-09-02, not a
simplification. Where a sample shows a rule being broken, it says so.

---

# ONE FILE, ONE CONCERN

A controller receives and responds. A use case decides. A repository reads and
writes. A DTO validates a wire shape. Nothing wears two of these hats.

**Controller — forbidden:** business logic, a database query, non-trivial
mapping, permission logic beyond the `@RequirePermissions` decorator, validation
logic beyond `@Body() dto: XxxDto`.

**Repository — forbidden:** business logic, permission logic, validation logic.
Allowed: `findById`, `findMany`, `create`, `update`, `delete`, and named query
methods (`findByPeriod`, `summariseMonth`) — never a generic `query(sql)` escape
hatch.

**Naming:** `*UseCase`, never `*Service`. `services/` is reserved for stateless
logic shared by two or more use cases — the ones in `presence/shared/services`,
`payroll/shared/services`, `credential/services`, `leave/services` and
`run/services` are the correct members.

**Use case size:** 50–150 lines is normal. 200+ is worth a second look. 300+
means the use case is doing more than one business responsibility and should
split. Nothing here is over 300 lines; `record-scan.use-case.ts` at 268 is the
one to watch.

## A use case decides. It does not query.

```ts
// presence/attendance-period/use-cases/close-attendance-period.use-case.ts
@Injectable()
export class CloseAttendancePeriodUseCase {
  constructor(
    private readonly periods: IAttendancePeriodRepository,
    private readonly prisma: PrismaService,       // ← the violation
  ) {}

  private async findIncomplete(year: number, month: number) {
    // a Prisma query, inside the application layer
  }
}
```

This is the sharpest rule break in the service, and it is worth being precise
about *why* it is worse than the DTO imports elsewhere:

- The use case now needs a database to be tested at all. Every other use case
  here can be tested with a fake port; this one cannot.
- The query it runs is invisible to the port, so no one reading
  `IAttendancePeriodRepository` learns that closing a period reads daily
  records.
- The rule it enforces — *a month with an unfinished day cannot close* — is the
  most consequential rule in the service, and it sits next to the plumbing that
  fetches its inputs.

The fix keeps the decision and moves the query:

```ts
// domain/repositories/attendance-period.repository.ts
export interface IncompleteRecord {
  userId: string
  displayName: string | null
  date: string
}

export abstract class IAttendancePeriodRepository {
  abstract findByPeriod(year: number, month: number): Promise<AttendancePeriod | null>
  abstract findIncompleteRecords(year: number, month: number): Promise<IncompleteRecord[]>
}
```

```ts
// application/use-cases/close-attendance-period/close-attendance-period.use-case.ts
constructor(private readonly periods: IAttendancePeriodRepository) {}

async execute(input: CloseAttendancePeriodInput): Promise<AttendancePeriodEntity> {
  const existing = await this.periods.findByPeriod(input.year, input.month)
  if (existing?.status === 'CLOSED') {
    throw new ConflictException('This period is already closed.')
  }

  const incomplete = await this.periods.findIncompleteRecords(input.year, input.month)
  if (incomplete.length > 0) { /* refuse, naming up to MAX_LISTED of them */ }
  // ...
}
```

`IncompleteRecord` moves with the query — a port's **output** type is declared
next to the port, exactly like its input type.

---

# TWO CROSSINGS, TWO DIFFERENT RULES

A request crosses three types on its way to the database:
`Dto → Input → RepositoryInput`. The two crossings are not symmetric — mixing
them up is the single most common mistake here.

## Controller → UseCase: pass the Dto straight through

```ts
@Post('close')
@RequirePermissions('attendance-periods.close')
async close(@Body() dto: CloseAttendancePeriodDto) {
  return this.closePeriod.execute(dto)
}
```

No mapper. TypeScript is structural: the Dto and the Input have the same shape,
so this compiles and the use case's declared parameter type is what actually
gets enforced. Do not write a field-by-field mapper here.

**The rule is about the type name, not the value.** The controller may hand its
Dto object to the use case. The use case may not `import` the Dto. Eighteen of
this service's thirty-three use cases currently do.

## UseCase → Repository: map every field, by hand

```ts
// forbidden
await this.periods.create(input)

// required
await this.periods.create({
  year: input.year,
  month: input.month,
  status: 'OPEN',
  closedBy: null,
})
```

The mapping step is where a field is computed, defaulted, or dropped. `status`
and `closedBy` are values no caller may set, and spreading the input is how a
caller eventually sets them.

---

# NO PRISMA IN `domain/`

```ts
// presence/leave/domain/entities/leave.entity.ts — the violation, 13 files
import { LeaveRequestStatus, LeaveTreatment } from '@prisma/client'
```

Seven `domain/entities/` files and several DTOs import enums from
`@prisma/client`. It is type-only, so nothing breaks at runtime — which is
exactly why it spreads.

What it costs: the domain's vocabulary is now defined by the schema. A leave
status cannot be renamed, deprecated, or given a domain-only member such as
`PENDING_HR` without a migration, and a reader of `domain/` cannot tell which
concepts the business owns and which the database does.

```ts
// right — domain/enums/leave-request-status.enum.ts
export enum LeaveRequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
```

The repository maps between the two. `portal-service` already works this way
(`domain/enums/content-status.enum.ts`); copy it.

The same rule covers `shared/domain/prisma-selects.ts`. A `select` shape is
infrastructure vocabulary; it belongs beside the repositories that use it, not
in a domain kernel.

---

# NO INLINE TYPES

A type declared at a use site cannot be referenced, tested, or changed in one
place.

`IncompleteRecord` is declared at the top of
`close-attendance-period.use-case.ts`. It is a port output type in an
application file — see above; it moves next to the port.

Also forbidden: an anonymous type at a use site, and
`Partial<Pick<Entity, ...>>` as a port parameter. It couples the write surface
to the entity's field list, so adding a field to the entity silently widens what
every caller may write. Name the fields.

---

# NO INLINE CONSTANTS

A literal that carries meaning gets a name in `constants/`. A literal that is
obvious from context does not.

This service already does the important one:

```ts
/** How many blocking records to name before the message gets useless. */
const MAX_LISTED = 10
```

Right instinct, wrong home — a module-level `const` in a use case file is
invisible to the rest of the module. It belongs in
`attendance-period/constants/`.

The literals that matter most here are the ones in presence arithmetic: a
grace-period length, a minimum working-minute threshold, a rounding unit. Those
must be named and must live in exactly one place — see "never duplicate presence
arithmetic" below.

```ts
// fine as-is — the meaning is the literal
if (records.length === 0)
```

---

# VALIDATION ONLY IN THE DTO

Format, presence, length, range, enum membership: `class-validator` in the DTO,
nowhere else.

The use case never re-checks a format the DTO enforced. What the use case checks
is everything a decorator cannot know: is this period already closed, is this
device registered, does this leave overlap an approved one, is this payroll run
approved. Those are database and state questions.

The dividing line: **a decorator can validate one field against itself. A use
case validates a field against the world.**

---

# COMMENT RULES

Zero comments in business code. Not on a use case, not on a repository method,
not on a controller. If a line needs a comment to be understood, the name is
wrong or the function is too long — fix that instead.

When relocating a file, strip the comments it already carries in the same pass,
including ones documenting a past bug. A test is how you document a past bug.

Swagger `@ApiProperty({ description })` is API documentation, not a comment, and
stays.

## The one that stays, and why

`CloseAttendancePeriodUseCase` carries this, and it stays:

```ts
/**
 * Closing a month is what fixes payroll's inputs, so it refuses while any
 * record is still incomplete.
 *
 * A day with an arrival and no departure is not a finished day — nobody has
 * decided whether the person left early, forgot to tap, or was on official
 * duty. Closing over it would carry that ambiguity straight into a payslip,
 * and an approved payroll run cannot be edited afterwards (FR-050). Better a
 * refusal now than an adjustment run later.
 */
```

It qualifies for the exception because it explains a **decision**, not the code:
why refusing is better than proceeding, what the ambiguity actually is, and the
downstream fact (FR-050) that makes the refusal cheap and the alternative
expensive. Nobody can recover that from `if (incomplete.length > 0) throw`, and
without it the check reads like an over-strict guard someone will relax the
first time it blocks a payroll run.

`payroll/integration/README.md` is the same exception at file scale, and it is
the most valuable document in the repo: it records that splitting payroll from
presence produced four silent arithmetic errors, and names each one.

The exception is narrow: cross-context decisions, `integration/` ports, and
`platform/` adapters. It does not license a comment on an ordinary use case.

---

# SCOPING EVERY QUERY

Every read is scoped by who is asking, in the repository, through a parameter
the use case passed down. Never by filtering in JavaScript after a wide read.

```ts
// wrong — reads every day's records, then narrows
const all = await this.prisma.dailyPresence.findMany()
return all.filter((r) => r.userId === userId && r.date >= from)

// right
return this.prisma.dailyPresence.findMany({ where: { userId, date: { gte: from, lt: to } } })
```

**Month bounds are `gte` / `lt`, never `lte`.** A `lte` on the month's last day
includes midnight of the following day, which is one of the four errors the
failed payroll split produced. It is not a style preference; it silently shifts
a payslip.

Reading your own attendance is a separate permission and a separate route from
reading anyone's — see `NESTJS-RULES.md`, "Reading your own record".

---

# MAPPER RULES

A mapper file is the exception, not the default.

Reach for `infrastructure/mappers/` only when a row's outward shape genuinely
differs from what Prisma returns — a joined relation flattened, a computed
field, an enum translated. Once `domain/enums/` exists, enum translation becomes
the repository's job and is a legitimate reason for a small mapper.

What is never allowed: a mapper that decides. If the transformation involves an
`if` on a business condition, that is a use case doing work in the wrong file.
Presence arithmetic is the case to guard hardest: a mapper that computes
`lateMinutes` on the way out of the database is a second implementation of the
rule, which is precisely the failure `payroll/integration/README.md` records.

---

# NEVER DUPLICATE PRESENCE ARITHMETIC

This service has one rule that outranks every style preference in this document.

`summariseMonth` and the late/present rules have **exactly one implementation.**
When payroll and presence were briefly separate services, the adapter carried a
copy, and the copy got four things wrong:

- `LATE` counted as a present day.
- `lateCount` keyed on status rather than minutes.
- `lateMinutes` accumulated unconditionally.
- The month was bounded `lte` rather than `lt`.

None failed a build. All four would have produced payslips that were quietly,
slightly wrong — the failure mode nobody notices until someone is underpaid.

So: no second copy, no "just for this report", no mapper that recomputes it, no
inline `filter` in a use case that re-derives whether a day counts. If a caller
needs the numbers, it calls the one implementation. If the one implementation is
inconvenient to call, fix its interface.

---

# HYGIENE: IMPORTS AND DEAD CODE

**Trim copy-pasted imports.** Files inherited multi-name import blocks during
the extraction; most use two or three names. Trim to what is
used — `pnpm run typecheck` proves the rest were unused.

**Dead code found on the way gets deleted**, and the commit message says so.
Before deleting anything in `daily-record`, grep `academic-service` as well — it
borrowed two methods from that module, and a port method that looks unused here
may be the one it calls.

**Every relative import ends in `.js`.** NodeNext ESM. The source is `.ts` and
the import is `.js`; this is correct and not a typo to fix.

---

# LANGUAGE

The backend is written in English — identifiers, types, log messages, commit
messages, and these documents. User-facing strings that reach an Indonesian
reader are the exception and are marked as such where they occur.

Keep the domain's words exact, because two contexts share this repo and the same
word means different things in each:

- A **scan** is one tap of a credential at a device. A **daily record** is a
  day's worth of scans resolved into arrival, departure and status. They are not
  interchangeable, and a scan is never "an attendance".
- A **period** is a month that can be open or closed. A **payroll run** is one
  execution of payroll over a closed period. Closing a period does not run
  payroll.
- **Leave** is an approved absence; an unexplained one is an **absence**. The
  distinction is what `LeaveTreatment` encodes, and blurring it in prose is how
  it gets blurred in code.

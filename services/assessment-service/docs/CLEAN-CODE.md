# CLEAN CODE

How one file, inside an already-correctly-placed module, should look. This is
the companion to `ARCHITECTURE.md`, not a replacement for it:

- `ARCHITECTURE.md` — where a piece of code lives (folders, layers, service
  boundary).
- `CLEAN-CODE.md` (here) — what that piece of code looks like once it is in
  the right place.
- `NESTJS-RULES.md` — the exhaustive rule list.
  This document is a grounded walk through the parts of it that come up
  constantly, worked through `academic-setting` and `academic-year` as real
  files rather than the generic `StudentService` placeholders there. Where the
  two disagree, `NESTJS-RULES.md` wins — say so and ask.

---

# ONE FILE, ONE CONCERN

A controller receives and responds. A use case decides. A repository reads and
writes. A DTO validates a wire shape. Nothing wears two of these hats.

Read a whole vertical slice from `academic-setting` — four files, four jobs,
nothing overlapping:

```ts
// presentation/http/academic-setting.controller.ts — receive, delegate, respond
@Patch()
@RequirePermissions('academic-settings.update')
async update(@Body() dto: UpdateAcademicSettingDto) {
  const setting = await this.updateAcademicSetting.execute({
    weeklyHolidays: dto.weeklyHolidays,
    defaultPassingScore: dto.defaultPassingScore,
  })
  return AcademicSettingResponseDto.fromDomain(setting)
}

// application/use-cases/update-academic-setting/update-academic-setting.use-case.ts — decide
async execute(input: UpdateAcademicSettingInput): Promise<AcademicSetting> {
  const existing = await this.repository.find()
  if (!existing) throw new NotFoundException(...)
  const validated = existing.withUpdate(input)   // the rule lives on the entity
  return this.repository.update(existing.id, {
    weeklyHolidays: validated.weeklyHolidays,
    defaultPassingScore: validated.defaultPassingScore,
  })
}

// infrastructure/persistence/prisma/prisma-academic-setting.repository.ts — read, write
async update(id: string, input: AcademicSettingRepositoryInput) {
  const row = await this.prisma.academicSetting.update({ where: { id }, data: { ... } })
  return AcademicSetting.reconstitute(row)
}
```

Nobody validates in the use case. Nobody decides in the repository. Nobody
touches Prisma in the controller. If you're writing a line and unsure which
file it belongs in, ask "which of these four jobs is this line doing" — that
answers it.

**Controller — forbidden:** business logic, a database query, non-trivial
mapping, permission logic beyond the `@RequirePermissions` decorator,
validation logic beyond `@Body() dto: XxxDto`.

**Repository — forbidden:** business logic, permission logic, validation
logic. Allowed: `findById`, `findMany`, `create`, `update`, `delete`, and named
query methods (`findByName`, `deactivateAll`) — never a generic `query(sql)`
escape hatch.

**Naming:** `*UseCase`, never `*Service`. `services/` (bare, or
`application/services/` post-migration) is reserved for stateless logic shared
by two or more use cases — `ClassroomCapacityService` in `enrollment`,
`AssertClassroomsExistService` in `calendar` — not a dumping ground for
business logic that belongs in one use case.

**Use case size:** 50–150 lines is normal. 200+ is worth a second look. 300+
means the use case is doing more than one business responsibility and should
split.

---

# TWO CROSSINGS, TWO DIFFERENT RULES

A request crosses three types on its way to the database:
`Dto → Input → RepositoryInput`. The two crossings are not symmetric — mixing
them up is the single most common mistake here.

## Controller → UseCase: pass the Dto straight through

```ts
// graduation.controller.ts — real code, not a simplification
async create(@Body() dto: CreateStudentGraduationDto) {
  return this.createUC.execute(dto)
}
```

No mapper. TypeScript is structural: `CreateStudentGraduationDto` and
`CreateStudentGraduationInput` have the same shape, so this compiles and the
use case's declared parameter type is what actually gets enforced. This is the
codebase-wide convention — 24 controllers across both migrated and
never-touched modules (`student`, `teacher`, `subject` included) do exactly
this. Do not write a field-by-field mapper here; it adds a file's worth of
boilerplate for zero behavior change.

`academic-setting.controller.ts` above maps explicitly instead
(`weeklyHolidays: dto.weeklyHolidays, ...`). That is the one outlier, not the
rule — harmless here because the object is small, but do not copy it as a
pattern for a new controller.

## UseCase → Repository: map every field, by hand

```ts
// forbidden
await this.subjectRepository.create(dto)

// required
await this.subjectRepository.create({
  code: dto.code,
  name: dto.name,
})
```

This crossing is enforced, not a style preference: `teacherIds` once reached
`subjectRepository.create(dto)` unmapped, and began assigning one teacher to
every classroom, because nobody had decided that field should travel that far.
`update-academic-setting.use-case.ts` and `update-academic-year.use-case.ts`
both do this correctly — every field named individually at the call site.

A passing spec does not catch a missed mapping here: `toHaveBeenCalledWith(dto)`
stays green whether the use case forwarded `dto` whole or rebuilt an
identical-looking object field by field, because Jest's equality does not know
which one happened. This is a read-the-diff rule, not a test-enforced one.

**Why the asymmetry:** a Dto is already a value the caller sent and the
pipeline validated — passing it on costs nothing extra. A `RepositoryInput` is
what persistence executes; a field that arrives there because it happened to
be present on some upstream object, rather than because someone put it there,
is exactly how a write path picks up a field nobody meant to send it.

---

# NO INLINE TYPES

The exact question that motivated this document: **where does
`AcademicSettingRepositoryInput` live?**

```ts
// domain/repositories/academic-setting.repository.ts — correct, as it stands
export interface AcademicSettingRepositoryInput {
  weeklyHolidays?: number[]
  defaultPassingScore?: number
}

export abstract class IAcademicSettingRepository {
  abstract update(
    id: string,
    input: AcademicSettingRepositoryInput,
  ): Promise<AcademicSetting>
}
```

**A repository port's input and result shapes live in the same file as the
port**, not in a separate `types/` file. Every migrated module does this —
`academic-year.repository.ts` alone defines `AcademicYearQueryInput`,
`CreateAcademicYearRepositoryInput`, `UpdateAcademicYearRepositoryInput` and
`AffectedCount` next to `IAcademicYearRepository`. The reasoning: the type has
exactly one reader — the port's own method signatures — so splitting it out
adds a file jump for a reader who was already looking at the only place that
type is used.

Split it out only when a second, unrelated port starts needing the same shape.
No module here has hit that yet.

> **Do not switch a port to taking the domain entity itself** —
> `create(entity: AcademicYear)` instead of `create(input: CreateAcademicYearRepositoryInput)`
> — even though that shape shows up in DDD/Hexagonal references elsewhere. It
> would require a full `toPersistence()` mapper on every port to unpick the
> entity back into what Prisma writes, for zero behavior change: the Prisma
> row is already close enough to what persistence needs that the dedicated
> `RepositoryInput` costs nothing extra today. If a port ever needs the
> entity-as-parameter shape for a real reason, that is a decision to raise
> explicitly, not a silent switch — it changes every port in every migrated
> module at once.

**Forbidden everywhere:** an `interface` declared inline inside a use case or
controller body. It belongs in `domain/entities/`, `domain/repositories/`, or
`application/use-cases/<name>/<name>.input.ts` — never typed ad hoc where it's
used.

**Also forbidden — repeating an object literal in a signature:**

```ts
// bad — this exact shape was copy-pasted across 27 files before PaginatedResult existed
async findAll(...): Promise<{ data: T[]; meta: { page: number; ... } }>

// good
async findAll(...): Promise<PaginatedResult<T>>
```

A narrow one-off projection is fine inline — `Promise<{ id: string } | null>`
for an existence check, `Promise<{ count: number }>` for a Prisma batch
payload. Naming those adds a hop without adding meaning; the rule targets
shapes that repeat or carry domain meaning, not every brace.

---

# NO INLINE CONSTANTS

```ts
// forbidden, inside a use case
if (status === 'ACTIVE') { ... }

// required
if (status === StudentStatus.ACTIVE) { ... }
```

Every migrated module keeps its magic numbers in `constants/`:

```ts
// academic-setting/constants/weekday.constants.ts
export const WEEKDAY_MIN = 0
export const WEEKDAY_MAX = 6
export const WEEKDAY_COUNT = 7
```

`WEEKDAY_MAX` is read in exactly one place (the policy that validates
`weeklyHolidays`), and it is still a named constant, not a literal `6` in that
`if`. A number that means something — a bound, a limit, a magic string used
for comparison — gets a name even when it has one caller.

---

# VALIDATION ONLY IN THE DTO

```ts
// forbidden, inside a use case
if (!name) throw new BadRequestException('name is required')

// correct — this check lives on the DTO
@IsString()
@IsNotEmpty()
name: string
```

`class-validator` decorators are the only place presence/format/type checks
happen. A use case may still throw — `ConflictException` for a duplicate name,
`NotFoundException` for a missing record — but that is a business rule
checked against the database, not input shape checked against nothing.

---

# COMMENT RULES

Default: **zero comments in a file.** A well-named function, parameter and
class reads as a sentence; a comment above one only repeats it.

A comment earns its place only when its absence would let a future edit
reintroduce a concrete failure it cannot see coming: a workaround for a
specific external bug, or a constraint enforced nowhere else — no test, no
type — that silently breaks if removed. It exists for the next editor to avoid
that failure, not to narrate today's decision to today's reviewer; the diff
and its description are where that belongs.

> **Porting a file is not an exemption.** During the `assessment` migration,
> comments were carried over verbatim on the reasoning that some documented a
> real prior bug — including one on `grading-scope-read.port.ts` recording an
> actual incident (a teacher with a custom role shown the admin screen). All of
> them were removed on review anyway. When a file moves, strip its comments in
> the same pass; do not treat "this one documents something real" as a reason
> to keep it.

Swagger `@ApiProperty({ description: '...' })` is API documentation for
consumers, not a comment in this sense, and is exempt.

Forbidden on sight: restating what the next line does, explaining why a
file/class/method is shaped the way it is, narrating the rationale behind a
design choice, describing what a class "represents" or "is for". When in
doubt: no comment.

---

# SCOPING EVERY QUERY

Single-school deployment — there is no `organizationId` to filter by. What
every academic query scopes by instead:

1. **Soft delete**, non-negotiable: `deletedAt: null`. Nearly every academic
   table is soft-deleted; a query missing this silently returns removed
   students, classes, and scores. `prisma-academic-year.repository.ts`'s
   `findAll` shows the shape: `deletedAt: null` sits directly in the `where`,
   always, not behind a flag.
2. **Period, wherever the row belongs to one** — `semesterId` for enrolments,
   teaching assignments, supervisors; `academicYearId` for classrooms,
   curricula, semesters. When the caller names neither, resolve the active
   period rather than reading across every year.

Forbidden: a `findMany()` with no `deletedAt` filter, or an unbounded list
read that ignores the active period.

---

# MAPPER RULES

A raw Prisma row never reaches the client untyped. In practice this is pinned
at the query, not through a mapper class: a repository declares its
`select`/`include` once in `*.includes.ts` and derives the return type from
it —

```ts
export const ACADEMIC_YEAR_SELECT = { id: true, name: true, ... } satisfies Prisma.AcademicYearSelect
```

or, where the entity is a class, through `reconstitute()`:

```ts
return row ? AcademicSetting.reconstitute(row) : null
```

Reach for a dedicated file under `infrastructure/mappers/` only when the
outward shape genuinely differs from the row — renamed or computed fields,
flattened relations. Most modules never need one.

> **Do not add a `Mapper<DomainEntity, PersistenceModel>` class as a matter of
> course** — some references treat it as mandatory on every repository. Here
> it is overhead with no behavior change whenever the query's `select` already
> matches what the domain needs, which is the common case. Add one only when
> you can point at a field that genuinely differs (renamed, computed,
> flattened) — the same rule as the `RepositoryInput` point above, for the
> same reason.

The controller's declared return type is the real contract: every list
endpoint returns `PaginatedResult<T>` (or its response-DTO wrapper), every
detail endpoint an explicit entity or response DTO. Never `any`, never an
inline object literal as a return type.

---

# HYGIENE: IMPORTS AND DEAD CODE

Two concrete things found during the migration work, both worth checking for
on any file you touch:

**Unused imports.** Every entity file inherited the same eight-name import
block from `shared/domain/entities` when the modules were first extracted;
most use two or three of the eight. `position.entity.ts` imported all eight
and used one. `pnpm run typecheck` does not fail on an unused import by
itself, but `pnpm run lint` does — never rely on "it compiles" as proof a file
is clean.

**Dead code.** A method declared on a concrete repository but absent from its
abstract port, with zero call sites anywhere in `src/`, is dead. Confirm with
a whole-tree grep before deleting — a method reachable through a
differently-named port method is not dead, it's just renamed at the boundary.
`enrollment`'s Prisma repository had four such methods removed in one pass;
the commit message named each one and why it was safe.

---

# LANGUAGE

The backend is written in English — messages, Swagger text, log lines, field
and class names, comments. Exempt only where text leaves the system as the
final thing a person reads with nothing left to translate it: rendered PDFs,
messages delivered verbatim to a person (password-reset emails, admission
notifications), and seed data (real school data, not interface text).
Indonesian anywhere else under `src/` is a bug.

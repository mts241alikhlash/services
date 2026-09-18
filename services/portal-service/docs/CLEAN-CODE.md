# CLEAN CODE

How one file, inside an already-correctly-placed module, should look. This is
the companion to `ARCHITECTURE.md`, not a replacement for it:

- `ARCHITECTURE.md` — where a piece of code lives (folders, layers, service
  boundary).
- `CLEAN-CODE.md` (here) — what that piece of code looks like once it is in the
  right place.
- `NESTJS-RULES.md` — the exhaustive rule list. This
  document is a grounded walk through the parts of it that come up constantly,
  worked through `post`, `agenda` and `shared/persistence` as real files rather
  than the generic placeholders there. Where the two disagree,
  `NESTJS-RULES.md` wins — say so and ask.

Every code sample below is real code from this repo as of 2026-09-02, not a
simplification. Where a sample shows a rule being broken, it says so.

---

# ONE FILE, ONE CONCERN

A controller receives and responds. A use case decides. A repository reads and
writes. A DTO validates a wire shape. Nothing wears two of these hats.

**One file also means one use case.** Nine files in this service hold between 2
and 9 use case classes each — `manage-agenda.use-cases.ts` alone holds nine.
That is the first thing to fix in any module you touch; see `ARCHITECTURE.md`,
step 0.

**Controller — forbidden:** business logic, a database query, non-trivial
mapping, permission logic beyond the `@RequirePermissions` decorator, validation
logic beyond `@Body() dto: XxxDto`.

**Repository — forbidden:** business logic, permission logic, validation logic.
Allowed: `findById`, `findMany`, `create`, `update`, `delete`, and named query
methods (`findTakenPostSlugs`, `findPostByHistoricalSlug`) — never a generic
`query(sql)` escape hatch.

**Naming:** `*UseCase`, never `*Service`. `services/` is reserved for stateless
logic shared by two or more use cases — `PostAuditService` and
`PostStatusSyncService` are the correct two.

**Use case size:** 50–150 lines is normal. 200+ is worth a second look. 300+
means the use case is doing more than one business responsibility and should
split. Nothing in this service is over 300 lines today; keep it that way.

## The repository split — copy this

`post` is the model, and it is the only place on the platform where a large
repository has been split correctly:

```
infrastructure/persistence/
├── prisma-post.repository.ts    204   the port implementation, delegating
├── post.reader.ts               195   eight named read functions
├── post.writer.ts               150   the `data` builders for each write
├── post.where.ts                183   query construction, pure
├── post.where.spec.ts           249   and its tests
└── post.includes.ts              29   the shared `include` shape
```

The rule this follows: **split a repository by what the functions do to the
query, not by which entity they touch.** Reads, writes, and `where`-building are
three different concerns, and `post.where.ts` being pure is what lets
`post.where.spec.ts` test filter logic without a database.

When another module's repository passes ~200 lines, split it this way rather
than by alphabet. See `NESTJS-RULES.md`, "SPLITTING A REPOSITORY".

---

# TWO CROSSINGS, TWO DIFFERENT RULES

A request crosses three types on its way to the database:
`Dto → Input → RepositoryInput`. The two crossings are not symmetric — mixing
them up is the single most common mistake here.

## Controller → UseCase: pass the Dto straight through

```ts
@Post()
@RequirePermissions('posts.create')
async create(@Body() dto: CreatePostDto) {
  return this.createPost.execute(dto)
}
```

No mapper. TypeScript is structural: `CreatePostDto` and `CreatePostInput` have
the same shape, so this compiles and the use case's declared parameter type is
what actually gets enforced. Do not write a field-by-field mapper here.

**The rule is about the type name, not the value.** The controller may hand its
Dto object to the use case. The use case may not `import` the Dto. Nineteen of
this service's thirty use case files currently do:

```ts
// agenda/use-cases/manage-agenda.use-cases.ts — the violation
async execute(query: AgendaQueryDto): Promise<PaginatedResponse<unknown>> {
```

## UseCase → Repository: map every field, by hand

```ts
// forbidden
await this.agendaRepository.findAll(query)

// required — and this is what the code already does
await this.agendaRepository.findAll({
  page: query.page,
  limit: query.limit,
  status: query.status,
  search: query.search,
  includeDeleted: query.includeDeleted,
})
```

`GetAgendaEntriesUseCase` gets this crossing right while getting the first one
wrong — it maps every field by hand into the port's input, and still names
`AgendaQueryDto` in its signature. Renaming the parameter type to
`GetAgendaEntriesInput` is the whole fix; the body does not change.

`post-repository.interface.ts` is the reference for the third boundary:
`CreatePostInput`, `UpdatePostInput`, `PublishPostInput`, `PostQueryInput`,
`PublicPostQueryInput`, `RelatedPostQueryInput` and `PostWithDetails`, all
declared next to the port. Copy that into every module.

---

# NO INLINE TYPES, AND NO `unknown` IN A RETURN

```ts
// agenda — the violation
async execute(query: AgendaQueryDto): Promise<PaginatedResponse<unknown>>
```

`unknown` in a return type is not a type, it is a refusal to name one. Every
caller then either casts or gives up on type safety, and the response shape —
the thing an API consumer actually depends on — is documented nowhere.

The shape exists; `toAdminAgenda` produces it. Name it:

```ts
// presentation/http/dto/response/agenda-admin.dto.ts
export class AgendaAdminDto { /* ... */ }

// application/use-cases/get-agenda-entries/get-agenda-entries.use-case.ts
async execute(input: GetAgendaEntriesInput): Promise<PaginatedResponse<AgendaAdmin>>
```

Note which layer each lives in: the use case returns a **domain-shaped**
`AgendaAdmin`, and the controller wraps it in the response DTO. A use case that
returns a `*Dto` has the same problem as one that accepts a `*Dto`.

Related and also forbidden: an anonymous type at a use site, and
`Partial<Pick<Entity, ...>>` as a port parameter. **A repository port's input
type lives next to the port**, in the same file as the abstract class.

---

# NO INLINE CONSTANTS

A literal that carries meaning gets a name in `constants/`. A literal that is
obvious from context does not.

```ts
// wrong                          // right
if (posts.length > 6)             if (posts.length > HOMEPAGE_LATEST_POSTS)
slug.slice(0, 200)                slug.slice(0, MAX_SLUG_LENGTH)
```

`post/constants/post.constants.ts` and `homepage/constants/` are where these
belong, and both already exist. Use them.

```ts
// fine as-is — the meaning is the literal
if (data.length === 0)
Math.ceil(total / limit)
```

---

# VALIDATION ONLY IN THE DTO

Format, presence, length, range, enum membership: `class-validator` in the DTO,
nowhere else.

The use case never re-checks a format the DTO enforced. What the use case checks
is everything a decorator cannot know: is this slug taken, may this post move
from draft to published, does this category still exist. Those are database and
state questions.

The dividing line: **a decorator can validate one field against itself. A use
case validates a field against the world.**

## The public surface raises the stakes

This is the only service with routes an anonymous caller can reach, so a
validation gap here is reachable without credentials. Two rules follow:

- **A public DTO is a whitelist, not a filter.** `PublicPostQueryDto` names
  exactly the query parameters an anonymous reader may set. Do not reuse the
  admin query DTO with a flag.
- **A public response DTO is a whitelist too.** `PostDetailDto` and
  `PostAdminDto` are separate classes for this reason. Never widen the public
  one to save a file — see `NESTJS-RULES.md`, "Read only the fields the caller
  shows".

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

`shared/persistence/optimistic-update.ts` carries fifteen lines of prose. It
stays, and it is worth understanding why it qualifies when a comment on a use
case would not:

```ts
/**
 * Every versioned portal model — post, page, agenda, album — needs the same
 * two-step: update only the row whose version still matches, then reload it.
 * Four copies of that is four chances for one to drift into `update()` instead
 * of `updateMany()`, which silently discards the other editor's work rather
 * than refusing.
 * ...
 * `null` means "someone else saved first" — the caller turns that into a 409.
 */
```

It documents three things no signature can carry: **why the helper exists** (to
prevent four divergent copies), **why it takes callbacks** rather than a Prisma
delegate (the delegates are distinct generated types), and **what `null` means**
to a caller. The `update()` vs `updateMany()` distinction is a correctness trap
where the wrong choice fails silently — the worst kind.

That is the test for the exception: *a decision a reader cannot recover from the
code, where getting it wrong fails quietly.* It applies to `shared/persistence`,
`platform/` adapters, and published contract types. It does not license a
comment on a use case.

---

# SCOPING EVERY QUERY

Every read is scoped by who is asking, in the repository, through a parameter
the use case passed down. Never by filtering in JavaScript after a wide read.

```ts
// wrong — reads every post, then narrows
const all = await this.prisma.post.findMany()
return all.filter((p) => p.status === 'PUBLISHED')

// right — and this is what post.where.ts is for
return this.prisma.post.findMany({ where: buildPublicPostWhere(query) })
```

`post.where.ts` is the pattern: query construction is a pure function with its
own spec, so the scoping rules are tested rather than trusted. A public read and
an admin read build different `where` clauses through different named functions
— never one function with a boolean.

Soft deletes count as scoping. `deletedAt: null` belongs in the `where`, not in
a `.filter()` after the fact, and `includeDeleted` is an explicit input the
caller must pass.

---

# MAPPER RULES

A mapper file is the exception, not the default.

`post.mapper.ts` earns its place: a post's outward shape flattens categories,
tags and an author profile, so what Prisma returns and what a caller receives
genuinely differ. That is when a mapper is right.

`post.includes.ts` is the pattern for everywhere else: name the `include` shape,
share it, return the row, and let the response DTO name the fields. No mapper.

What is never allowed: a mapper that decides. If the transformation involves an
`if` on a business condition, that is a use case doing work in the wrong file.
`toAdminAgenda` is on the line — check what it does before moving it; if it only
renames and flattens, it belongs in `infrastructure/mappers/`, and if it chooses
what an admin may see, it belongs in a response DTO.

---

# HYGIENE: IMPORTS AND DEAD CODE

**Trim copy-pasted imports.** Files inherited multi-name import blocks during
the extraction; most use two or three names. Trim to what is
used — `pnpm run typecheck` proves the rest were unused.

**Do not import `@prisma/client` outside `infrastructure/`.** One file in this
service does. A domain entity or DTO that imports a Prisma enum has made the ORM
part of that layer's vocabulary, and the enum cannot then change without a
schema migration. `domain/enums/content-status.enum.ts` and
`domain/enums/post-type.enum.ts` are the right answer — this service already
declares its own enums, so use them.

**Dead code found on the way gets deleted**, and the commit message says so. A
method on a Prisma repository not declared on the port and called nowhere is
dead. Grep the whole tree first — a method reachable through a differently-named
port method is not dead.

**Every relative import ends in `.js`.** NodeNext ESM. The source is `.ts` and
the import is `.js`; this is correct and not a typo to fix.

---

# LANGUAGE

The backend is written in English — identifiers, types, log messages, commit
messages, and these documents. User-facing strings that reach an Indonesian
reader are the exception: portal content itself is Indonesian, and that is data,
not code.

Keep the domain's words exact. A **post** is an article; a **page** is static
content with a navigation entry; an **agenda** entry is a dated event; an
**album** holds **photos**. "Content" is the union of all of them and is not a
type — do not introduce a `ContentEntity` that means whichever of the four the
caller had in mind.

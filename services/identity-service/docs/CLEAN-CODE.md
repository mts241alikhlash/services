# CLEAN CODE

How one file, inside an already-correctly-placed module, should look. This is
the companion to `ARCHITECTURE.md`, not a replacement for it:

- `ARCHITECTURE.md` — where a piece of code lives (folders, layers, service
  boundary).
- `CLEAN-CODE.md` (here) — what that piece of code looks like once it is in the
  right place.
- `NESTJS-RULES.md` — the exhaustive rule list. This
  document is a grounded walk through the parts of it that come up constantly,
  worked through `user`, `auth` and `access-control` as real files rather than
  the generic placeholders there. Where the two disagree, `NESTJS-RULES.md`
  wins — say so and ask.

Every code sample below is real code from this repo as of 2026-09-02, not a
simplification. Where a sample shows a rule being broken, it says so.

---

# ONE FILE, ONE CONCERN

A controller receives and responds. A use case decides. A repository reads and
writes. A DTO validates a wire shape. Nothing wears two of these hats.

```ts
// use-cases/create-user.use-case.ts — decide
async execute(input: CreateUserInput) {
  const taken = await this.userRepository.existsByIdentifier(input.identifier)
  if (taken) {
    throw new ConflictException(`Identifier ${input.identifier} already in use`)
  }

  const user = await this.userRepository.create({
    identifier: input.identifier,
    passwordHash: await hashPassword(input.password),
  })

  this.logger.log(`User created: ${input.identifier}`)
  return user
}
```

That is the shape to copy: one decision (is the identifier taken), one write,
one log line. Note what it does *not* do — it does not validate the identifier's
format, because `CreateUserDto` already did; it does not hash inline, because
`hashPassword` is a shared helper; it does not build a response, because the
controller does.

> The file above currently reads `async execute(dto: CreateUserDto)`. The
> `Input` rename is step 3 of the module conversion in `ARCHITECTURE.md`; the
> body does not change.

**Controller — forbidden:** business logic, a database query, non-trivial
mapping, permission logic beyond the `@RequirePermissions` decorator, validation
logic beyond `@Body() dto: XxxDto`.

**Repository — forbidden:** business logic, permission logic, validation logic.
Allowed: `findById`, `findAll`, `create`, `update`, `remove`, and named query
methods (`findByIdentifier`, `existsByIdentifier`) — never a generic
`query(sql)` escape hatch.

**Naming:** `*UseCase`, never `*Service`. `services/` is reserved for stateless
logic shared by two or more use cases — `PasswordManagerService`,
`TokenManagerService`, `AuthSessionService` are the correct three — not a
dumping ground for business logic that belongs in one use case.

**Use case size:** 50–150 lines is normal. 200+ is worth a second look. 300+
means the use case is doing more than one business responsibility and should
split. Nothing in this service is over 300 today; keep it that way.

---

# TWO CROSSINGS, TWO DIFFERENT RULES

A request crosses three types on its way to the database:
`Dto → Input → RepositoryInput`. The two crossings are not symmetric — mixing
them up is the single most common mistake here.

## Controller → UseCase: pass the Dto straight through

```ts
// presentation/user.controller.ts
@Post()
@RequirePermissions('users.create')
async create(@Body() dto: CreateUserDto) {
  return this.createUser.execute(dto)
}
```

No mapper. TypeScript is structural: `CreateUserDto` and `CreateUserInput` have
the same shape, so this compiles and the use case's declared parameter type is
what actually gets enforced. Do not write a field-by-field mapper here; it adds
a file's worth of boilerplate for zero behaviour change.

**The rule is about the type name, not the value.** The controller may hand its
Dto object to the use case. The use case may not `import` the Dto. Eleven of
this service's thirty-five use cases currently do — that is the conversion work,
not a style preference.

## UseCase → Repository: map every field, by hand

```ts
// forbidden
await this.userRepository.create(input)

// required
await this.userRepository.create({
  identifier: input.identifier,
  passwordHash: await hashPassword(input.password),
})
```

`create-user.use-case.ts` already does this correctly, and it is why the use case
can hash the password on the way past: the mapping step is where a field is
transformed, dropped, or renamed. Spreading the input would have written
`password` — a plaintext field the repository has no column for and must never
see.

---

# NO INLINE TYPES

```ts
// update-user.use-case.ts — the violation, today
const data: Partial<{
  identifier: string
  passwordHash: string
  isActive: boolean
}> = {}
```

An anonymous type declared at a use site cannot be referenced, tested, or
changed in one place. It also duplicates — badly — a type the port already
needs. The fix names it once, next to the port:

```ts
// domain/repositories/user.repository.ts
export interface UpdateUserRepositoryInput {
  identifier?: string
  passwordHash?: string
  isActive?: boolean
}

export abstract class IUserRepository {
  abstract update(id: string, data: UpdateUserRepositoryInput): Promise<UserPublic>
}
```

```ts
// application/use-cases/update-user/update-user.use-case.ts
const data: UpdateUserRepositoryInput = {}
```

**A repository port's input type lives next to the port**, in the same file as
the abstract class — not in the use case, not in a shared types barrel. The port
declares what may be written; the use case decides what to write.

Two related shapes that are also forbidden:

- `Partial<Pick<UserEntity, 'identifier' | 'passwordHash' | 'isActive'>>` as a
  port parameter. It looks tidy and it couples the write surface to the entity's
  field list, so adding a field to the entity silently widens what every caller
  may write. `IUserRepository.update` has this today.
- An inline return type on a repository method. Name it, export it, put it in
  the port file.

---

# NO INLINE CONSTANTS

A literal that carries meaning gets a name in `constants/`. A literal that is
obvious from context does not.

```ts
// wrong                          // right
setTimeout(fn, 900000)            setTimeout(fn, ACCESS_TOKEN_TTL_MS)
if (attempts > 5)                 if (attempts > MAX_LOGIN_ATTEMPTS)
```

```ts
// fine as-is — the meaning is the literal
if (users.length === 0)
return items.slice(0, 1)
```

`permission-codes.constants.ts` is the extreme case of doing this right: 1759
lines of named permission codes, read as one catalogue by the sync bootstrap. It
is a data file, and the file-size rule does not apply to it.

---

# VALIDATION ONLY IN THE DTO

Format, presence, length, range, enum membership: `class-validator` in the DTO,
nowhere else.

```ts
// dto/request/create-user.dto.ts
@IsString()
@MinLength(3)
@ApiProperty({ description: 'Login identifier — NIS, NIP, or email' })
identifier!: string
```

The use case never re-checks a format the DTO enforced. What the use case checks
is everything a decorator cannot know: is this identifier already taken, does
this user exist, is this session still live, may this role be deleted. Those are
database questions, and they belong in the use case precisely because they are.

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

**The one sanctioned exception: a trade-off at a service boundary.** A file that
implements a cross-service contract may carry a comment stating the trade the
design makes and what it costs — not what the code does. The reference example
is not in this repo; it is
`inventory-service/src/platform/identity/http-identity.adapter.ts`, which
explains in prose that caching an introspection response makes revocation
eventually consistent within a bounded window, and why unreachable means 503
rather than 401. That is a decision a reader cannot recover from the code, and
it would otherwise live only in someone's memory.

This exception is narrow. It applies to `platform/` adapters and published
contract DTOs. It does not license a comment on a use case.

---

# SCOPING EVERY QUERY

Every read is scoped by who is asking, in the repository, through a parameter
the use case passed down. Never by filtering in JavaScript after a wide read.

```ts
// wrong — reads every session, then narrows
const all = await this.prisma.authSession.findMany()
return all.filter((s) => s.userId === userId)

// right
return this.prisma.authSession.findMany({ where: { userId } })
```

This matters more here than anywhere else in the platform: this service holds
sessions and credentials, and a wide read that gets filtered late is a wide read
that will eventually get logged, cached, or returned by accident.

Reading your own record is a separate permission and a separate route —
`GET /auth/profile` is not `GET /users/:id` with a self check bolted on. See
`NESTJS-RULES.md`, "Reading your own record".

---

# MAPPER RULES

A mapper file is the exception, not the default.

Reach for `infrastructure/mappers/` only when a row's outward shape genuinely
differs from what Prisma returns — a joined relation flattened, a computed
field, an enum translated. When the shapes match, return the row and let the
response DTO name the fields.

`prisma-user.includes.ts` and `prisma-role.includes.ts` are the right pattern
for the common case: the `include` shape is named and shared, and no mapper
exists because none is needed.

What is never allowed: a mapper that decides. If the transformation involves an
`if` on a business condition, that is a use case doing work in the wrong file.

---

# HYGIENE: IMPORTS AND DEAD CODE

**Trim copy-pasted imports.** Entity files inherited multi-name import blocks
from `shared/domain/entities` during the extraction; most use two or three
names. Trim to what is used — `pnpm run typecheck` proves the rest
were unused.

**Two types must never share a name.** `UserEntity` is currently declared in
`user/domain/entities/user.entity.ts` and imported from
`shared/domain/entities/user.entity.js` by the file next to it. Resolve this
when converting `user`; do not carry it forward.

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
reader are the exception and are marked as such where they occur.

`identifier` is the platform's word for what a person types to sign in — it is
an NIS, an NIP, or an email depending on the role. Do not call it `username`,
`email`, or `login` in new code; the schema, the DTOs, and `IAM.md` all say
`identifier`.

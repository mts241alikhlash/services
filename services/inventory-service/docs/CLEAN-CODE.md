# CLEAN CODE

How one file, inside an already-correctly-placed module, should look. This is
the companion to `ARCHITECTURE.md`, not a replacement for it:

- `ARCHITECTURE.md` — where a piece of code lives (folders, layers, service
  boundary).
- `CLEAN-CODE.md` (here) — what that piece of code looks like once it is in the
  right place.
- `NESTJS-RULES.md` — the exhaustive rule list. This
  document is a grounded walk through the parts of it that come up constantly,
  worked through `asset`, `circulation` and `platform/identity` as real files
  rather than the generic placeholders there. Where the two disagree,
  `NESTJS-RULES.md` wins — say so and ask.

Every code sample below is real code from this repo as of 2026-09-02, not a
simplification. Where a sample shows a rule being broken, it says so.

---

# ONE FILE, ONE CONCERN

A controller receives and responds. A use case decides. A repository reads and
writes. A DTO validates a wire shape. Nothing wears two of these hats.

`asset.controller.ts` is the shape to copy — six injected use cases, each route
delegating and returning:

```ts
@ApiTags('Inventory Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/assets')
export class AssetController {
  constructor(
    private readonly getAssetsUseCase: GetAssetsUseCase,
    private readonly createAssetUseCase: CreateAssetUseCase,
    // ...
  ) {}
}
```

**Controller — forbidden:** business logic, a database query, non-trivial
mapping, permission logic beyond the `@RequirePermissions` decorator, validation
logic beyond `@Body() dto: XxxDto`.

**Repository — forbidden:** business logic, permission logic, validation logic.
Allowed: `findById`, `findMany`, `create`, `update`, `delete`, and named query
methods (`findLatestAssetByPrefix`, `findCategoryById`) — never a generic
`query(sql)` escape hatch.

**Naming:** `*UseCase`, never `*Service`. `services/` (bare, or
`application/services/` post-migration) is reserved for stateless logic shared
by two or more use cases — not a dumping ground for business logic that belongs
in one use case.

**Use case size:** 50–150 lines is normal. 200+ is worth a second look. 300+
means the use case is doing more than one business responsibility and should
split.

## The counter-example, in full

`create-asset.use-case.ts` breaks three rules at once, and it is worth reading
as a whole because every violation in this service looks like some part of it:

```ts
async execute(dto: CreateAssetDto) {                       // 1. names the Dto
  const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1

  const category = await this.assetRepository.findCategoryById(dto.categoryId)
  const catCode = category ? category.code.toUpperCase() : 'GEN'
  const year = new Date(dto.purchaseDate).getFullYear()
  const prefix = `AST-${catCode}/${year}/`

  // Next parent (batch) sequence, 3 digits, scoped to category+year prefix.
  const latestParent = await this.assetRepository.findLatestAssetByPrefix(prefix)
  let seq = 1                                              // 2. a domain rule,
  if (latestParent) {                                      //    inline
    const lastPart = latestParent.assetNumber.split('/').pop()
    seq = (parseInt(lastPart ?? '', 10) || 0) + 1
  }
  const assetNumber = `${prefix}${seq.toString().padStart(3, '0')}`
  // ...                                                   // 3. explanatory comments
}
```

1. **It names the Dto.** `CreateAssetDto` carries `class-validator` decorators
   and `@ApiProperty`; the use case now depends on the HTTP contract. Twenty-two
   of forty use cases here do this.
2. **The asset-numbering rule is inline.** `AST-<CAT>/<YEAR>/<NNN>` and
   `<assetNumber>-<NN>` is the format the whole institution reads off a physical
   label. It is a domain rule with a name, and it is currently expressed as
   fifteen lines of string manipulation inside one use case, where nothing tests
   it directly and nothing else can reuse it.
3. **It carries comments** that restate what the next line does.

The corrected shape:

```ts
// domain/policies/asset-number.policy.ts
export function nextAssetNumber(prefix: string, latest: string | null): string
export function unitNumbersFor(assetNumber: string, quantity: number): string[]

// application/use-cases/create-asset/create-asset.use-case.ts
async execute(input: CreateAssetInput) {
  const category = await this.assetRepository.findCategoryById(input.categoryId)
  const prefix = assetNumberPrefix(category?.code, input.purchaseDate)
  const latest = await this.assetRepository.findLatestAssetByPrefix(prefix)

  const assetNumber = nextAssetNumber(prefix, latest?.assetNumber ?? null)
  const units = unitNumbersFor(assetNumber, input.quantity ?? 1).map(/* ... */)
  // ...
}
```

The policy functions are pure, so they get a spec that runs in milliseconds and
covers the cases that actually bite: the first asset of a year, the 999th, a
category that was deleted, a `latest` whose suffix is not a number.

---

# TWO CROSSINGS, TWO DIFFERENT RULES

A request crosses three types on its way to the database:
`Dto → Input → RepositoryInput`. The two crossings are not symmetric — mixing
them up is the single most common mistake here.

## Controller → UseCase: pass the Dto straight through

```ts
@Post()
@RequirePermissions('assets.create')
async create(@Body() dto: CreateAssetDto) {
  return this.createAssetUseCase.execute(dto)
}
```

No mapper. TypeScript is structural: `CreateAssetDto` and `CreateAssetInput`
have the same shape, so this compiles and the use case's declared parameter type
is what actually gets enforced. Do not write a field-by-field mapper here.

**The rule is about the type name, not the value.** The controller may hand its
Dto object to the use case. The use case may not `import` the Dto.

## UseCase → Repository: map every field, by hand

```ts
// forbidden
await this.assetRepository.create(input)

// required
await this.assetRepository.create({
  assetNumber,
  name: input.name,
  categoryId: input.categoryId,
  purchaseDate: new Date(input.purchaseDate),
  purchasePrice: input.purchasePrice,
})
```

`create-asset.use-case.ts` already does this correctly for its units — it builds
`CreateAssetUnitSeedInput[]` field by field rather than spreading. That is why
`assetNumber`, a value the caller never sent, can be part of the write: the
mapping step is where a field is computed, transformed, or dropped.

---

# NO INLINE TYPES

A type declared at a use site cannot be referenced, tested, or changed in one
place.

```ts
// wrong
const units: { unitNumber: string; barcode: string; conditionId: string }[] = []

// right — CreateAssetUnitSeedInput, declared next to the port
import { CreateAssetUnitSeedInput } from '../domain/repositories/asset.repository.js'
const units: CreateAssetUnitSeedInput[] = []
```

This service already gets the important half right: `CreateAssetUnitSeedInput`
lives in the repository interface file, next to the port that consumes it. Keep
that placement when the file moves to `domain/repositories/`.

**A repository port's input type lives next to the port**, in the same file as
the abstract class — not in the use case, not in a shared types barrel. The port
declares what may be written; the use case decides what to write.

Also forbidden: `Partial<Pick<Entity, ...>>` as a port parameter. It couples the
write surface to the entity's field list, so adding a field to the entity
silently widens what every caller may write. Name the fields.

---

# NO INLINE CONSTANTS

A literal that carries meaning gets a name in `constants/`. A literal that is
obvious from context does not.

```ts
// wrong                            // right
const catCode = 'GEN'               const catCode = UNCATEGORISED_ASSET_CODE
seq.toString().padStart(3, '0')     seq.toString().padStart(ASSET_SEQ_DIGITS, '0')
n.toString().padStart(2, '0')       n.toString().padStart(UNIT_SEQ_DIGITS, '0')
```

The three literals on the right are the asset-number format. They appear in
`create-asset.use-case.ts` and again in `add-units.use-case.ts`. Two copies of a
format is how a label printer and a database drift apart.

```ts
// fine as-is — the meaning is the literal
if (units.length === 0)
const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1
```

---

# VALIDATION ONLY IN THE DTO

Format, presence, length, range, enum membership: `class-validator` in the DTO,
nowhere else.

The use case never re-checks a format the DTO enforced. What the use case checks
is everything a decorator cannot know: does this category exist, is this unit
lendable, is this asset already borrowed. Those are database questions, and they
belong in the use case precisely because they are.

The dividing line: **a decorator can validate one field against itself. A use
case validates a field against the world.**

Note the smell in `create-asset.use-case.ts`:

```ts
const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1
```

That is a validation rule (`quantity` must be a positive integer) being silently
repaired in the use case. Either the DTO enforces `@IsInt() @Min(1)` and the use
case trusts it, or `quantity` is genuinely optional and the default belongs in
one named place. Coercing bad input to `1` without telling anyone is neither.

---

# COMMENT RULES

Zero comments in business code. Not on a use case, not on a repository method,
not on a controller. If a line needs a comment to be understood, the name is
wrong or the function is too long — fix that instead.

```ts
// delete these two, and every one like them
// Next parent (batch) sequence, 3 digits, scoped to category+year prefix.
// Units: assetNumber + '-NN'.
```

Both comments in `create-asset.use-case.ts` exist because the code beneath them
is unnamed domain logic. Extracting `nextAssetNumber()` and `unitNumbersFor()`
deletes the comments by making them unnecessary — which is the point. A comment
that survives extraction was documentation; a comment that disappears was a
symptom.

When relocating a file, strip the comments it already carries in the same pass,
including ones documenting a past bug. A test is how you document a past bug.

Swagger `@ApiProperty({ description })` is API documentation, not a comment, and
stays.

**The one sanctioned exception: a trade-off at a service boundary.**
`platform/identity/identity.port.ts` and `http-identity.adapter.ts` carry real
prose, and it stays. They explain that caching an introspection response makes
revocation eventually consistent within a bounded window, and that an
unreachable `identity-service` yields 503 rather than 401 because the two send an
operator to different places. Neither is recoverable from the code, and both are
decisions someone will otherwise reverse by accident.

The exception is narrow: `platform/` adapters and published contract types. It
does not license a comment on a use case.

---

# SCOPING EVERY QUERY

Every read is scoped by who is asking, in the repository, through a parameter
the use case passed down. Never by filtering in JavaScript after a wide read.

```ts
// wrong — reads every circulation record, then narrows
const all = await this.prisma.circulation.findMany()
return all.filter((c) => c.borrowerId === userId)

// right
return this.prisma.circulation.findMany({ where: { borrowerId: userId } })
```

Scoping here uses the identity `platform/identity` resolved — `userId`, `roles`,
`permissions` off `request.user`. It never re-reads a user from a table, because
there is no user table in this database.

---

# MAPPER RULES

A mapper file is the exception, not the default.

Reach for `infrastructure/mappers/` only when a row's outward shape genuinely
differs from what Prisma returns — a joined relation flattened, a computed
field, an enum translated. When the shapes match, return the row and let the
response DTO name the fields.

`prisma-asset.includes.ts` is the right pattern for the common case: the
`include` shape is named and shared, and no mapper exists because none is
needed.

What is never allowed: a mapper that decides. If the transformation involves an
`if` on a business condition, that is a use case doing work in the wrong file.

---

# HYGIENE: IMPORTS AND DEAD CODE

**Trim copy-pasted imports.** Files inherited multi-name import blocks during
the extraction; most use two or three names. Trim to what is
used — `pnpm run typecheck` proves the rest were unused.

**Do not import `@prisma/client` outside `infrastructure/`.** One file in this
service does. A domain entity that imports a Prisma enum has made the ORM part
of the domain's vocabulary, and the enum then cannot change without a schema
migration. Declare the enum in `domain/` and map to Prisma's in the repository.

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

Keep the domain's words exact: an **asset** is the catalogued thing, a **unit**
is one physical copy of it with its own barcode, and a **circulation** is one
borrow-and-return of a unit. `AssetUnit` is never "item", and a circulation is
never a "loan" in code even though that is what a librarian calls it.

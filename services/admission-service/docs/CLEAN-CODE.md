# CLEAN CODE

How one file, inside an already-correctly-placed module, should look. This is
the companion to `ARCHITECTURE.md`, not a replacement for it:

- `ARCHITECTURE.md` — where a piece of code lives (folders, layers, service
  boundary).
- `CLEAN-CODE.md` (here) — what that piece of code looks like once it is in the
  right place.
- `NESTJS-RULES.md` — the exhaustive rule list. This
  document is a grounded walk through the parts of it that come up constantly,
  worked through `verify-application`, `admission-status.transitions` and
  `integration/` as real files rather than the generic placeholders there. Where
  the two disagree, `NESTJS-RULES.md` wins — say so and ask.

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
methods (`findActiveWithDocsAndPayment`, `findRequiredActiveDocumentTypes`,
`setVerified`) — never a generic `query(sql)` escape hatch.

**Naming:** `*UseCase`, never `*Service`. `services/` is reserved for stateless
logic shared by two or more use cases. `AdmissionNotificationService` is the
correct and only member today — six use cases send notices through it.

**Use case size:** 50–150 lines is normal. 200+ is worth a second look. 300+
means the use case is doing more than one business responsibility and should
split.

## Where the domain rule goes

`verify-application.use-case.ts` shows both halves of this, one done right and
one done wrong:

```ts
async execute(applicationId: string, adminId: string) {
  const application = await this.repository.findActiveWithDocsAndPayment(applicationId)
  if (!application) throw new NotFoundException('Application not found')

  assertTransition(application.status, 'VERIFIED')          // ✅ rule lives in domain/

  const requiredTypes = await this.repository.findRequiredActiveDocumentTypes()
  const unapproved = requiredTypes.filter((type) => {       // ❌ rule inline
    const doc = (application.documents ?? []).find((d) => d.documentTypeId === type.id)
    return doc?.status !== 'APPROVED'
  })
  if (unapproved.length > 0) {
    throw new ConflictException(
      `All required documents must be approved first: ${unapproved.map((t) => t.name).join(', ')}`,
    )
  }

  if (application.payment?.status !== 'VERIFIED') {         // ❌ rule inline
    throw new ConflictException('The payment must be verified first')
  }
  // ...
}
```

The status transition is a named function in `domain/` with its own table of
legal moves. The other two rules — *every required document is approved* and
*the payment is verified* — are the same kind of rule, expressed as inline
`filter`/`find` in the use case, where nothing tests them directly.

Both are self-contained: given the application and the required types, they need
no further lookup. So both are policies:

```ts
// domain/policies/verification-readiness.policy.ts
export function unapprovedRequiredDocuments(
  application: AdmissionApplication,
  requiredTypes: DocumentType[],
): DocumentType[]

export function assertPaymentVerified(application: AdmissionApplication): void
```

The use case then reads as orchestration only: fetch, assert transition, assert
readiness, write, notify. That is the whole point of the layer.

**The test for "is this a policy":** can you decide it with the objects already
in hand? If yes, it is a policy and belongs in `domain/policies/`. If it needs
another repository call, it stays in the use case.

---

# TWO CROSSINGS, TWO DIFFERENT RULES

A request crosses three types on its way to the database:
`Dto → Input → RepositoryInput`. The two crossings are not symmetric — mixing
them up is the single most common mistake here.

## Controller → UseCase: pass the Dto straight through

```ts
@Post(':id/submit')
@RequirePermissions('applications.submit')
async submit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SubmitApplicationDto) {
  return this.submitApplication.execute(id, dto)
}
```

No mapper. TypeScript is structural: the Dto and the Input have the same shape,
so this compiles and the use case's declared parameter type is what actually
gets enforced. Do not write a field-by-field mapper here.

**The rule is about the type name, not the value.** The controller may hand its
Dto object to the use case. The use case may not `import` the Dto. Nineteen of
this service's thirty-six use cases currently do — that is the conversion work,
not a style preference.

## UseCase → Repository: map every field, by hand

```ts
// forbidden
await this.repository.create(input)

// required
await this.repository.create({
  waveId: input.waveId,
  applicantId: input.applicantId,
  status: 'DRAFT',
})
```

The mapping step is where a field is computed, transformed, or dropped —
`status: 'DRAFT'` is a value no caller may set, and spreading the input is how a
caller eventually sets it.

---

# NO INLINE TYPES

A type declared at a use site cannot be referenced, tested, or changed in one
place.

```ts
// wrong
const patch: { status?: string; verifiedAt?: Date; verifiedBy?: string } = {}

// right — declared next to the port it is passed to
import { SetVerifiedRepositoryInput } from '../domain/repositories/admission-application.repository.js'
const patch: SetVerifiedRepositoryInput = {}
```

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

Status strings are the case that matters here. `'VERIFIED'`, `'APPROVED'`,
`'ENROLLED'` appear as bare literals across use cases while
`admission-status.transitions.ts` holds the authoritative union. Import the
union; do not retype its members.

```ts
// wrong
if (application.payment?.status !== 'VERIFIED')

// right
if (application.payment?.status !== PaymentStatus.VERIFIED)
```

A typo in a bare status literal is not a compile error — it is a rule that
silently never fires. That is exactly the failure a named union prevents.

---

# VALIDATION ONLY IN THE DTO

Format, presence, length, range, enum membership: `class-validator` in the DTO,
nowhere else.

The use case never re-checks a format the DTO enforced. What the use case checks
is everything a decorator cannot know: does this wave still accept
registrations, is this transition legal, are the required documents approved.
Those are database and state questions, and they belong in the use case or a
policy precisely because they are.

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

## The two comments in this service worth discussing

**`admission.serializers.ts`:**

```ts
// Decimal instances get mangled by the global ClassSerializerInterceptor
// (instanceToPlain copies its internal {s,e,d} props), so convert money fields
// to plain numbers before returning from use-cases.
```

This is a comment documenting a past bug, and the rule says a test documents a
past bug. It is right that the knowledge is written down and wrong that it is
written *here*: nothing fails if someone deletes `serializeWave` and returns the
row directly — a caller just receives `{s, e, d}` where a fee should be, and
probably not in a way anyone notices before it reaches a screen.

The fix is a spec asserting `serializeWave({ registrationFee: new Decimal('150000') })`
yields a `number`, and a one-line reference in the function name
(`toPlainMoneyFields` says more than `serializeWave`). Then the comment goes.

**`integration/student-enrolment.port.ts`** carries thirty lines of prose about
what the enrolment handover replaced and what its non-atomicity costs. **That
stays.** It is the sanctioned exception: a trade-off at a service boundary, not
a description of the code. A reader cannot recover "this was deliberately made
non-atomic, and idempotency is why that is safe" from the type signature, and
someone will otherwise reverse it.

The exception is narrow: `integration/`, `platform/` adapters, and published
contract types. It does not license a comment on a use case.

---

# SCOPING EVERY QUERY

Every read is scoped by who is asking, in the repository, through a parameter
the use case passed down. Never by filtering in JavaScript after a wide read.

```ts
// wrong — reads every application, then narrows
const all = await this.prisma.admissionApplication.findMany()
return all.filter((a) => a.applicantId === applicantId)

// right
return this.prisma.admissionApplication.findMany({ where: { applicantId } })
```

This matters especially for the applicant-facing routes. An applicant reading
their own application is a different permission and a different route from an
admin reading any application — `GET /admission/my-application` is not
`GET /admission/applications/:id` with a self check bolted on. See
`NESTJS-RULES.md`, "Reading your own record".

---

# MAPPER RULES

A mapper file is the exception, not the default.

Reach for `infrastructure/mappers/` only when a row's outward shape genuinely
differs from what Prisma returns — a joined relation flattened, a computed
field, a `Decimal` converted. When the shapes match, return the row and let the
response DTO name the fields.

`prisma-admission.includes.ts` and `prisma-admission-application.includes.ts`
are the right pattern for the common case: the `include` shape is named and
shared, and no mapper exists because none is needed.

The `serialize*` functions in `domain/admission.serializers.ts` are mappers in
the wrong layer — they shape an HTTP response, so they are presentation. On
conversion they become `*ResponseDto` classes with `fromDomain()` static
methods under `presentation/http/dto/response/`.

What is never allowed: a mapper that decides. If the transformation involves an
`if` on a business condition, that is a use case doing work in the wrong file.

---

# HYGIENE: IMPORTS AND DEAD CODE

**Trim copy-pasted imports.** Files inherited multi-name import blocks during
the extraction; most use two or three names. Trim to what is
used — `pnpm run typecheck` proves the rest were unused.

**Dead code found on the way gets deleted**, and the commit message says so. A
method on a Prisma repository not declared on the port and called nowhere is
dead. Grep the whole tree first — a method reachable through a differently-named
port method is not dead.

`enrollAsStudent()` was the largest such deletion and it is already done. Do not
resurrect it; see `ARCHITECTURE.md`, Part 2.

**Watch the 408-line repository.**
`prisma-admission-applicant.repository.ts` is the biggest file here and past the
point where one repository is one concern. Split it along the aggregate lines in
`ARCHITECTURE.md`'s stage 1, not by arbitrary line count.

**Every relative import ends in `.js`.** NodeNext ESM. The source is `.ts` and
the import is `.js`; this is correct and not a typo to fix.

---

# LANGUAGE

The backend is written in English — identifiers, types, log messages, commit
messages, and these documents. User-facing strings that reach an Indonesian
reader are the exception and are marked as such where they occur.

Keep the domain's words exact. An **applicant** is a person who registered; an
**application** is the form they submitted; a **wave** is the intake period it
belongs to. An applicant becomes a **student** only in `academic-service`, never
here — this service's last act is marking the application `ENROLLED`.

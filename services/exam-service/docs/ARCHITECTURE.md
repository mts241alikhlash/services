# exam-service architecture

Layered per module, as in the other services (see `CONSTITUTION.md` and
`NESTJS-RULES.md`):

```
src/<module>/
  domain/          entities, value objects, policies, repository ports (no Nest, no Prisma)
  application/     use cases, one folder each, input types
  infrastructure/  Prisma repositories, storage and HTTP adapters
  presentation/    controllers and request/response DTOs
  <module>.module.ts
```

- A controller calls use cases only and returns a response DTO built with
  `static fromDomain()`.
- A use case depends on repository ports and lookup ports, never on Prisma or
  `fetch`.
- Reads of other services go through `src/platform/*-lookup` ports with an
  HTTP adapter; nothing imports another service's source or Prisma client.
- Question content is validated by domain policies (`validate-question-content`,
  `sanitize-question-html`) before it reaches a repository.
- Files live in object storage through `StorageService`; the database keeps the
  key and metadata.

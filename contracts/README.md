# Service contract staging

OpenAPI baselines belong under `<service>/openapi.json`. Existing service emitters
are preserved under `services/<service>/src/openapi/`.

Run `pnpm openapi:emit` from the repository root. The root command runs one
service at a time because each Prisma service generates its own client into the
shared workspace dependency, then copies the provider document into this
directory.

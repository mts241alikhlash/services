import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const SRC = join(process.cwd(), 'src')

const ALLOWED = new Map<string, string>([
  [
    'access-control/permission/guards/permission.guard.ts',
    'The bypass itself. The one sanctioned role-name check (ADR-0011).',
  ],
  [
    'access-control/role/domain/policies/structural-roles.policy.ts',
    'Declares the role so bootstrap can create it. Names it, decides nothing.',
  ],
  [
    'access-control/role/application/use-cases/update-role/update-role.use-case.ts',
    'Refuses to modify the SUPER_ADMIN role. Withholds, never grants.',
  ],
  [
    'access-control/role/application/use-cases/get-roles/get-roles.use-case.ts',
    'Hides the SUPER_ADMIN role from role lists it does not belong in.',
  ],
  [
    'access-control/role/application/use-cases/get-role-by-id/get-role-by-id.use-case.ts',
    'Same visibility rule, for a single role.',
  ],
  [
    'access-control/role/application/use-cases/assign-role-to-user/assign-role-to-user.use-case.ts',
    'Stops a non-super-admin handing out the SUPER_ADMIN role.',
  ],
  [
    'access-control/role/infrastructure/persistence/prisma/prisma-role.repository.ts',
    'Applies that visibility rule as a query predicate.',
  ],
  [
    'access-control/permission/infrastructure/persistence/prisma/prisma-permission.repository.ts',
    'Same, for the permissions the role list exposes.',
  ],
])

async function sourceFiles(): Promise<string[]> {
  const files: string[] = []
  for await (const entry of glob('**/*.ts', { cwd: SRC })) {
    if (!entry.endsWith('.spec.ts')) files.push(entry.replace(/\\/g, '/'))
  }
  return files
}

describe('the role-name bypass is not copied (ADR-0011)', () => {
  let sources: { path: string; text: string }[]

  beforeAll(async () => {
    const files = await sourceFiles()
    sources = await Promise.all(
      files.map(async (path) => ({
        path,
        text: await readFile(join(SRC, path), 'utf8'),
      })),
    )
  }, 60_000)

  it('finds source files to check', () => {
    expect(sources.length).toBeGreaterThan(100)
  })

  it('names SUPER_ADMIN only where the allowlist accounts for it', () => {
    const offenders = sources
      .filter((source) => !ALLOWED.has(source.path))
      .filter((source) =>
        source.text
          .split('\n')
          .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
          .some((line) => line.includes('SUPER_ADMIN')),
      )
      .map((source) => source.path)

    expect(offenders).toEqual([])
  })

  it('allows nothing that has since moved', () => {
    const paths = new Set(sources.map((source) => source.path))
    const stale = [...ALLOWED.keys()].filter((path) => !paths.has(path))

    expect(stale).toEqual([])
  })

  it('keeps the bypass in the guard', () => {
    const guard = sources.find(
      (source) =>
        source.path === 'access-control/permission/guards/permission.guard.ts',
    )

    expect(guard?.text).toContain("const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'")
    expect(guard?.text).toContain('roleCodes.includes(SUPER_ADMIN_ROLE)')
  })
})

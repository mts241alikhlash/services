import { readFile } from 'node:fs/promises'
import { STRUCTURAL_ROLES } from './structural-roles.policy.js'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const SRC = join(process.cwd(), 'src')

const ROLE_CODE_FIELD = /roleCode:\s*'([A-Z_]+)'/g

const ROLE_RELATION = /\brole:\s*\{\s*code:\s*'([A-Z_]+)'/g

const ROLE_QUERY =
  /\brole\.(?:findUnique|findFirst)\([\s\S]{0,120}?code:\s*'([A-Z_]+)'/g

function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

function matches(text: string, pattern: RegExp): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(new RegExp(pattern.source, 'g'))) {
    found.add(match[1])
  }
  return [...found]
}

function protectedByCode(): string[] {
  return STRUCTURAL_ROLES.map((role) => role.code)
}

describe('roles the code resolves by name are protected from deletion', () => {
  let source: string

  beforeAll(async () => {
    const parts: string[] = []
    for await (const entry of glob('**/*.ts', { cwd: SRC })) {
      if (!entry.endsWith('.spec.ts')) {
        parts.push(await readFile(join(SRC, entry), 'utf8'))
      }
    }
    source = code(parts.join('\n'))
  }, 60_000)

  it('finds the sources', () => {
    expect(source.length).toBeGreaterThan(1000)
  })

  it('protects every role the code resolves by name', () => {
    const resolved = [
      ...matches(source, ROLE_CODE_FIELD),
      ...matches(source, ROLE_RELATION),
      ...matches(source, ROLE_QUERY),
    ]

    const protectedCodes = protectedByCode()
    const unprotected = [...new Set(resolved)]
      .filter((role) => !protectedCodes.includes(role))
      .sort()

    expect(unprotected).toEqual([])
  })

  it('recognises all three shapes it looks for', () => {
    expect(matches(`roleCode: 'TEACHER',`, ROLE_CODE_FIELD)).toEqual([
      'TEACHER',
    ])
    expect(
      matches(`where: { userId, role: { code: 'STUDENT' } }`, ROLE_RELATION),
    ).toEqual(['STUDENT'])
    expect(
      matches(
        `this.prisma.role.findUnique({\n  where: { code: 'APPLICANT' },\n})`,
        ROLE_QUERY,
      ),
    ).toEqual(['APPLICANT'])
  })

  it('names the roles the application actually protects', () => {
    expect(protectedByCode()).toContain('TEACHER')
    expect(protectedByCode()).toContain('APPLICANT')
    expect(protectedByCode()).not.toContain('SARPRAS')
  })

  describe('every requiredBy is checkable', () => {
    const FILENAME = /[a-z0-9-]+(?:\.[a-z0-9-]+)*\.ts/g

    const CROSS_SERVICE =
      /^Cross-service — (?:[a-z-]+-service: [^;]+)(?:; [a-z-]+-service: [^;]+)*$/

    it('points at files that exist and name the role', async () => {
      const broken: string[] = []

      for (const role of STRUCTURAL_ROLES) {
        if (role.requiredBy.startsWith('Cross-service')) {
          continue
        }
        for (const file of role.requiredBy.match(FILENAME) ?? []) {
          const found: string[] = []
          for await (const entry of glob(`**/${file}`, { cwd: SRC })) {
            found.push(entry)
          }
          if (found.length === 0) {
            broken.push(`${role.code}: ${file} does not exist`)
            continue
          }
          const texts = await Promise.all(
            found.map((entry) => readFile(join(SRC, entry), 'utf8')),
          )
          if (!texts.some((text) => text.includes(`'${role.code}'`))) {
            broken.push(`${role.code}: ${file} does not name it`)
          }
        }
      }

      expect(broken).toEqual([])
    })

    it('states which service owes every cross-service claim', () => {
      const SERVICES = [
        'academic-service',
        'admission-service',
        'inventory-service',
        'portal-service',
        'presence-service',
      ]

      const crossService = STRUCTURAL_ROLES.filter((role) =>
        role.requiredBy.startsWith('Cross-service'),
      )

      expect(crossService.map((role) => role.code)).toEqual([
        'TEACHER',
        'STUDENT',
        'APPLICANT',
      ])

      const malformed = crossService
        .filter((role) => !CROSS_SERVICE.test(role.requiredBy))
        .map((role) => role.code)
      expect(malformed).toEqual([])

      const unknown = crossService.flatMap((role) =>
        [...role.requiredBy.matchAll(/([a-z-]+-service):/g)]
          .map((match) => match[1])
          .filter((service) => !SERVICES.includes(service))
          .map((service) => `${role.code}: unknown service ${service}`),
      )
      expect(unknown).toEqual([])
    })

    it('finds no code path for a role that claims none', () => {
      const claimsNone = STRUCTURAL_ROLES.filter((role) =>
        role.requiredBy.startsWith('No code path'),
      )
      expect(claimsNone.map((role) => role.code)).toEqual(['ADMIN'])

      const resolved = new Set([
        ...matches(source, ROLE_CODE_FIELD),
        ...matches(source, ROLE_RELATION),
        ...matches(source, ROLE_QUERY),
      ])

      const contradicted = claimsNone
        .map((role) => role.code)
        .filter((code) => resolved.has(code))

      expect(contradicted).toEqual([])
    })
  })
})

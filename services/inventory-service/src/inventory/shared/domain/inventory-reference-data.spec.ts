import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const SRC = join(process.cwd(), 'src', 'inventory')
const MIGRATIONS = join(process.cwd(), 'prisma', 'migrations')

const STATUS_KEY = /(?:systemKey:\s*|BySystemKey\(\s*)'([A-Z_]+)'/g

const TX_CODE = /(?:code:\s*|ByCode\(\s*)'(TX-[A-Z-]+)'/g

function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

function withoutEnumDeclarations(sql: string): string {
  return sql.replace(/CREATE\s+TYPE[\s\S]*?;/gi, '')
}

async function read(dir: string, pattern: string): Promise<string> {
  const parts: string[] = []
  for await (const entry of glob(pattern, { cwd: dir })) {
    parts.push(await readFile(join(dir, entry), 'utf8'))
  }
  return parts.join('\n')
}

function referenced(text: string, pattern: RegExp): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(new RegExp(pattern.source, 'g'))) {
    found.add(match[1])
  }
  return [...found].sort()
}

describe('inventory reference data exists for every code the source asks for', () => {
  let source: string
  let migrations: string

  beforeAll(async () => {
    source = code(await read(SRC, '**/*.ts'))
    migrations = withoutEnumDeclarations(await read(MIGRATIONS, '**/*.sql'))
  }, 60_000)

  it('finds the sources and the migrations', () => {
    expect(source.length).toBeGreaterThan(1000)
    expect(migrations.length).toBeGreaterThan(1000)
  })

  it('ships a status for every system role the code looks up', () => {
    const asked = referenced(source, STATUS_KEY)
    expect(asked.length).toBeGreaterThan(0)

    const unshipped = asked.filter((key) => !migrations.includes(`'${key}'`))
    expect(unshipped).toEqual([])
  })

  it('ships a transaction type for every code the code looks up', () => {
    const asked = referenced(source, TX_CODE)
    expect(asked.length).toBeGreaterThan(0)

    const unshipped = asked.filter((code) => !migrations.includes(`'${code}'`))
    expect(unshipped).toEqual([])
  })

  it('recognises the shapes it is looking for', () => {
    expect(
      referenced(`where: { systemKey: 'LOAN_APPROVED' }`, STATUS_KEY),
    ).toEqual(['LOAN_APPROVED'])
    expect(
      referenced(`findStatusBySystemKey('LOAN_RETURNED')`, STATUS_KEY),
    ).toEqual(['LOAN_RETURNED'])
    expect(referenced(`where: { code: 'TX-LOAN-OUT' }`, TX_CODE)).toEqual([
      'TX-LOAN-OUT',
    ])
    expect(
      referenced(`findTransactionTypeByCode('TX-LOAN-IN')`, TX_CODE),
    ).toEqual(['TX-LOAN-IN'])
  })

  it('does not count a role as shipped because the enum names it', () => {
    const declarationOnly = `CREATE TYPE "InventoryStatusKey" AS ENUM ('AVAILABLE', 'LOANED');`

    expect(withoutEnumDeclarations(declarationOnly)).not.toContain('AVAILABLE')
    expect(
      withoutEnumDeclarations(
        `${declarationOnly}\nINSERT INTO "inventory_statuses" VALUES ('AVAILABLE');`,
      ),
    ).toContain('AVAILABLE')
  })
})

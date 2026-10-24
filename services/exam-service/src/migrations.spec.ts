import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS = join(process.cwd(), 'prisma', 'migrations')

const folders = readdirSync(MIGRATIONS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

describe('migrations', () => {
  it('finds the migrations', () => {
    expect(folders.length).toBeGreaterThan(0)
  })

  it.each(folders)('%s holds nothing but SQL', (folder) => {
    const sql = readFileSync(join(MIGRATIONS, folder, 'migration.sql'), 'utf8')

    expect(sql).not.toMatch(/[┌│└─┐┘]/u)
    expect(sql).not.toMatch(/Update available/u)
    expect(sql.trimEnd().endsWith(';')).toBe(true)
  })
})

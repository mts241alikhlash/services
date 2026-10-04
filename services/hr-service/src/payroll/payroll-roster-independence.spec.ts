import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const PAYROLL_SRC = join(process.cwd(), 'src', 'payroll')

const FORBIDDEN_MODELS = [
  'prisma.position',
  'prisma.positionCategory',
  'prisma.employeePosition',
  'prisma.employmentType',
  'positionId',
  'positionCategoryId',
  'employmentTypeId',
]

const FORBIDDEN_CODES = [
  'KEPALA_SEKOLAH',
  'WAKIL_KEPALA',
  'GURU_MAPEL',
  'WALI_KELAS',
  'STAF_TU',
  'KEPALA_TU',
  'PNS',
  'GTY',
  'GTT',
  'PTY',
  'PTT',
  'HONORER',
]

async function payrollSourceFiles(): Promise<string[]> {
  const files: string[] = []
  for await (const entry of glob('**/*.ts', { cwd: PAYROLL_SRC })) {
    if (!entry.endsWith('.spec.ts')) files.push(entry)
  }
  return files
}

describe('payroll roster independence (FR-055, FR-056)', () => {
  let sources: { path: string; text: string }[]

  beforeAll(async () => {
    const files = await payrollSourceFiles()
    sources = await Promise.all(
      files.map(async (path) => ({
        path,
        text: await readFile(join(PAYROLL_SRC, path), 'utf8'),
      })),
    )
  })

  it('finds payroll source files to check', () => {
    expect(sources.length).toBeGreaterThan(20)
  })

  it.each(FORBIDDEN_MODELS)('never reads %s', (model) => {
    const offenders = sources
      .filter((source) => source.text.includes(model))
      .map((source) => source.path)

    expect(offenders).toEqual([])
  })

  it.each(FORBIDDEN_CODES)('never branches on the code %s', (code) => {
    const offenders = sources
      .filter((source) => source.text.includes(`'${code}'`))
      .map((source) => source.path)

    expect(offenders).toEqual([])
  })

  it('takes the roster from active employees alone', async () => {
    const adapter = await readFile(
      join(PAYROLL_SRC, 'integration/local-payroll-roster.adapter.ts'),
      'utf8',
    )

    expect(adapter).toContain('?.isActive')
    for (const needle of FORBIDDEN_MODELS) {
      expect(adapter).not.toContain(needle)
    }
  })

  it('asks the staff module for the roster through its port, not Prisma', async () => {
    const adapter = await readFile(
      join(PAYROLL_SRC, 'integration/local-payroll-roster.adapter.ts'),
      'utf8',
    )

    expect(adapter).toContain('IEmployeeIdentityReadPort')
    expect(adapter).toContain('listRosterUserIds()')
    expect(adapter).not.toContain('PrismaService')
  })
})

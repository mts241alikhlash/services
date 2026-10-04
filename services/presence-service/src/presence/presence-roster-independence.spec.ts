import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const ROOTS = [join(process.cwd(), 'src', 'presence')]

const FORBIDDEN_MODELS = [
  'prisma.position',
  'prisma.positionCategory',
  'prisma.teacherPosition',
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

async function sourceFiles(root: string): Promise<string[]> {
  const files: string[] = []
  for await (const entry of glob('**/*.ts', { cwd: root })) {
    if (!entry.endsWith('.spec.ts')) files.push(entry)
  }
  return files
}

describe('presence roster independence (FR-055, FR-056)', () => {
  let sources: { path: string; text: string }[]

  beforeAll(async () => {
    sources = (
      await Promise.all(
        ROOTS.map(async (root) => {
          const files = await sourceFiles(root)
          return Promise.all(
            files.map(async (path) => ({
              path: join(root, path),
              text: await readFile(join(root, path), 'utf8'),
            })),
          )
        }),
      )
    ).flat()
  })

  it('finds source files to check', () => {
    expect(sources.length).toBeGreaterThan(40)
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
})

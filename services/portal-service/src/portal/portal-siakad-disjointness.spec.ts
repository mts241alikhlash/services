import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const PORTAL_SRC = join(process.cwd(), 'src', 'portal')

const FORBIDDEN_MODELS = [
  'prisma.announcement',
  'prisma.announcementClassroom',
  'prisma.event',
  'prisma.eventAudience',
  'prisma.eventClassroom',
]

const FORBIDDEN_IMPORTS = ['/academic/', '/inventory/', '/admission/']

async function portalSourceFiles(): Promise<string[]> {
  const files: string[] = []
  for await (const entry of glob('**/*.ts', { cwd: PORTAL_SRC })) {
    if (!entry.endsWith('.spec.ts')) files.push(entry)
  }
  return files
}

describe('portal ↔ SIAKAD disjointness (FR-046)', () => {
  let sources: { path: string; text: string }[]

  beforeAll(async () => {
    const files = await portalSourceFiles()
    sources = await Promise.all(
      files.map(async (path) => ({
        path,
        text: await readFile(join(PORTAL_SRC, path), 'utf8'),
      })),
    )
  })

  it('finds portal source files to check', () => {
    expect(sources.length).toBeGreaterThan(20)
  })

  it.each(FORBIDDEN_MODELS)(
    "never queries SIAKAD's %s from anywhere in portal/",
    (model) => {
      const offenders = sources
        .filter((file) => file.text.includes(model))
        .map((file) => file.path)

      expect(offenders).toEqual([])
    },
  )

  it('never imports from academic, inventory, or admission', () => {
    const offenders = sources
      .filter((file) =>
        FORBIDDEN_IMPORTS.some((domain) => file.text.includes(domain)),
      )
      .map((file) => file.path)

    expect(offenders).toEqual([])
  })

  it('models its own announcements as portal posts', async () => {
    const schema = await readFile(
      join(process.cwd(), 'prisma', 'portal.prisma'),
      'utf8',
    )

    expect(schema).toContain('PENGUMUMAN')
    expect(schema).toContain('@@map("portal_posts")')
    expect(schema).not.toContain('@@map("announcements")')
    expect(schema).not.toContain('@@map("events")')
  })
})

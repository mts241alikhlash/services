import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const SRC = join(process.cwd(), 'src')

const USER_INCLUDE = /\buser:\s*\{\s*include\s*:/g

const USER_TRUE = /\buser:\s*true\b/g

interface Source {
  path: string
  text: string
}

function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

async function sourceFiles(): Promise<string[]> {
  const files: string[] = []
  for await (const entry of glob('**/*.ts', { cwd: SRC })) {
    if (!entry.endsWith('.spec.ts')) files.push(entry)
  }
  return files
}

function offenders(sources: Source[], pattern: RegExp): string[] {
  return sources
    .filter((source) => new RegExp(pattern.source, 'g').test(source.text))
    .map((source) => source.path)
}

describe('no read takes every column of a User', () => {
  let sources: Source[]

  beforeAll(async () => {
    const files = await sourceFiles()
    sources = await Promise.all(
      files.map(async (path) => ({
        path,
        text: code(await readFile(join(SRC, path), 'utf8')),
      })),
    )
  })

  it('finds the backend sources to check', () => {
    expect(sources.length).toBeGreaterThan(100)
  })

  it('never reaches a user relation with `include`', () => {
    expect(offenders(sources, USER_INCLUDE)).toEqual([])
  })

  it('never reaches a user relation with `true`', () => {
    expect(offenders(sources, USER_TRUE)).toEqual([])
  })

  it('recognises the shape it is looking for', () => {
    const leaky = `{ user: { include: { profile: PROFILE_NAME_SELECT } } }`
    const safe = `{ user: { select: { id: true, profile: PROFILE_NAME_SELECT } } }`

    expect(new RegExp(USER_INCLUDE.source).test(leaky)).toBe(true)
    expect(new RegExp(USER_INCLUDE.source).test(safe)).toBe(false)
    expect(new RegExp(USER_TRUE.source).test(`{ user: true }`)).toBe(true)
  })
})

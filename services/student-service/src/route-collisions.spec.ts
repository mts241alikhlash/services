import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const SRC = join(process.cwd(), 'src')

const CONTROLLER_PREFIX = /@Controller\(\s*'([^']*)'/
const ROUTE = /@(Get|Post|Patch|Put|Delete|All)\(\s*(?:'([^']*)')?\s*\)/g

interface Route {
  file: string
  method: string
  path: string
}

function matcher(path: string): RegExp {
  const source = path
    .split('/')
    .map((segment) =>
      segment.startsWith(':')
        ? '[^/]+'
        : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/')
  return new RegExp(`^${source}$`)
}

function concrete(path: string): string {
  return path
    .split('/')
    .map((segment) => (segment.startsWith(':') ? 'a-value' : segment))
    .join('/')
}

function normalise(prefix: string, path: string): string {
  return `/${prefix}/${path}`.replace(/\/+/g, '/').replace(/(.)\/$/, '$1')
}

describe('no two controllers claim the same URL', () => {
  let routes: Route[]

  beforeAll(async () => {
    const found: Route[] = []
    for await (const entry of glob('**/*.controller.ts', { cwd: SRC })) {
      if (entry.endsWith('.spec.ts')) continue
      const text = (await readFile(join(SRC, entry), 'utf8'))
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')

      const prefix = CONTROLLER_PREFIX.exec(text)?.[1]
      if (prefix === undefined) continue

      const re = new RegExp(ROUTE.source, 'g')
      let m: RegExpExecArray | null
      while ((m = re.exec(text))) {
        found.push({
          file: entry.replace(/\\/g, '/'),
          method: m[1].toUpperCase(),
          path: normalise(prefix, m[2] ?? ''),
        })
      }
    }
    routes = found
  }, 60_000)

  it('finds the routes to check', () => {
    expect(routes.length).toBeGreaterThan(30)
  })

  it('never lets one controller answer for another', () => {
    const collisions: string[] = []

    for (let i = 0; i < routes.length; i++) {
      for (let j = i + 1; j < routes.length; j++) {
        const a = routes[i]
        const b = routes[j]
        if (a.file === b.file) continue
        if (a.method !== b.method) continue
        if (!matcher(a.path).test(concrete(b.path))) continue
        if (!matcher(b.path).test(concrete(a.path))) continue

        collisions.push(
          `${a.method} ${a.path} (${a.file}) and ${b.path} (${b.file}) match the same request`,
        )
      }
    }

    expect(collisions.sort()).toEqual([])
  })

  it('recognises the shapes it looks for', () => {
    expect(matcher('/students/:id').test('/students/a-value')).toBe(true)
    expect(matcher('/students/me').test('/students/a-value')).toBe(false)
    expect(routes.some((route) => route.path.includes(':'))).toBe(true)
    expect(routes.some((route) => route.method === 'PATCH')).toBe(true)
  })
})

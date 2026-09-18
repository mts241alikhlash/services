import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'node:fs/promises'

const SRC = join(process.cwd(), 'src')

const DECLARED_CALLER =
  /@CurrentUser\((?:'[a-zA-Z]+')?\)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[:,)]/

function blankComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
}

function handlerBody(text: string, from: number): string {
  let i = from
  let depth = 1
  while (i < text.length) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') {
      depth--
      if (depth === 0) break
    }
    i++
  }
  while (i < text.length && text[i] !== '{') i++
  const start = i
  let braces = 0
  while (i < text.length) {
    if (text[i] === '{') braces++
    else if (text[i] === '}') {
      braces--
      if (braces === 0) break
    }
    i++
  }
  return text.slice(start + 1, i)
}

function ignoredCallers(text: string): string[] {
  const source = blankComments(text)
  const re = new RegExp(DECLARED_CALLER.source, 'g')
  const found: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(source))) {
    const name = m[1]
    if (!new RegExp('\\b' + name + '\\b').test(handlerBody(source, m.index))) {
      found.push(name)
    }
  }
  return found
}

describe('no controller asks for a caller it ignores', () => {
  let controllers: { path: string; text: string }[]

  beforeAll(async () => {
    const found: { path: string; text: string }[] = []
    for await (const entry of glob('**/*.controller.ts', { cwd: SRC })) {
      if (entry.endsWith('.spec.ts')) continue
      found.push({
        path: entry.replace(/\\/g, '/'),
        text: await readFile(join(SRC, entry), 'utf8'),
      })
    }
    controllers = found
  }, 60_000)

  it('finds the controllers', () => {
    expect(controllers.length).toBeGreaterThan(12)
  })

  it('reads every caller it injects', () => {
    const offenders = controllers
      .flatMap((c) =>
        ignoredCallers(c.text).map((name) => `${c.path}: ${name}`),
      )
      .sort()

    expect(offenders).toEqual([])
  })

  it('never injects the caller under an underscore name', () => {
    const offenders = controllers
      .filter((c) => /@CurrentUser\([^)]*\)\s*_[a-zA-Z]*\s*:/.test(c.text))
      .map((c) => c.path)
      .sort()

    expect(offenders).toEqual([])
  })

  it('recognises the shapes it looks for', () => {
    const ignored = `
      async findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: StudentQueryDto,
      ) {
        return this.getStudentsUseCase.execute(query);
      }`
    const used = `
      async findMine(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: StudentQueryDto,
      ) {
        return this.getStudentsUseCase.execute({ ...query, userId: user.id });
      }`
    const braceInLaterParam = `
      async logout(
        @CurrentUser() user: AuthenticatedUser,
        @Res({ passthrough: true }) res: Response,
      ) {
        await this.logoutUseCase.execute(user.sessionId);
      }`

    expect(ignoredCallers(ignored)).toEqual(['user'])
    expect(ignoredCallers(used)).toEqual([])
    expect(ignoredCallers(braceInLaterParam)).toEqual([])
  })
})

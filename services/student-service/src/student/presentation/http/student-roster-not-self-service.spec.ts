import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

describe('the student roster stays a management read', () => {
  const CONTROLLER = join(
    process.cwd(),
    'src',
    'student',
    'presentation',
    'http',
    'student.controller.ts',
  )

  let source: string

  beforeAll(async () => {
    source = await readFile(CONTROLLER, 'utf8')
  })

  it('never guards the roster with students.read-own', () => {
    const rosterStart = source.indexOf('@Get()')
    const rosterEnd = source.indexOf("@Get('me')")
    expect(rosterEnd).toBeGreaterThan(rosterStart)

    expect(source.slice(rosterStart, rosterEnd)).not.toContain(
      'students.read-own',
    )
  })

  it('keeps the roster on students.read', () => {
    expect(source).toMatch(/@Get\(\)\s*@RequirePermissions\('students\.read'\)/)
  })

  it('declares the self-service route before its :id sibling', () => {
    const me = source.indexOf("@Get('me')")
    const byId = source.indexOf("@Get(':id')")

    expect(me).toBeGreaterThan(-1)
    expect(byId).toBeGreaterThan(me)
  })

  it('guards the self-service route with students.read-own', () => {
    expect(source).toMatch(
      /@Get\('me'\)\s*@RequirePermissions\('students\.read-own'\)/,
    )
  })

  it('does not take a caller on the roster route', () => {
    const rosterStart = source.indexOf('@Get()')
    const rosterEnd = source.indexOf("@Get('me')")
    const roster = source.slice(rosterStart, rosterEnd)

    expect(roster).not.toContain('@CurrentUser()')
  })

  it('still passes the caller to the single-student read, which does narrow', () => {
    const detailStart = source.indexOf("@Get(':id')")
    const detail = source.slice(detailStart, detailStart + 600)

    expect(detail).toContain('@CurrentUser()')
    expect(detail).toContain('reqUser')
  })
})

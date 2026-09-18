import { Prisma } from '@prisma/client'
import { buildSubjectInclude } from './prisma-subject.includes.js'

describe('buildSubjectInclude', () => {
  const SEMESTER_ID = 'sem-1'

  function employeeSelect(include: Prisma.SubjectInclude) {
    const assignments =
      include.teachingAssignments as Prisma.Subject$teachingAssignmentsArgs
    return assignments.select
  }

  it('loads the teachingAssignments relation, not just its count', () => {
    const include = buildSubjectInclude(SEMESTER_ID)

    expect(include.teachingAssignments).toBeDefined()
    expect(include._count).toBeDefined()
  })

  it('carries the employee id and does not join the employee', () => {
    const select = employeeSelect(buildSubjectInclude(SEMESTER_ID))

    expect(select).toMatchObject({ employeeId: true })
    expect(select).not.toHaveProperty('employee')
  })

  it('names the classroom, since a subject can differ per class', () => {
    const select = employeeSelect(buildSubjectInclude(SEMESTER_ID))

    expect(select).toMatchObject({
      classroom: { select: { id: true, name: true } },
    })
  })

  it('scopes assignments to the active semester and skips deleted rows', () => {
    const include = buildSubjectInclude(SEMESTER_ID)
    const assignments =
      include.teachingAssignments as Prisma.Subject$teachingAssignmentsArgs

    expect(assignments.where).toEqual({
      deletedAt: null,
      semesterId: { equals: SEMESTER_ID },
    })
  })

  it('matches nothing when no semester is active', () => {
    const include = buildSubjectInclude(null)
    const assignments =
      include.teachingAssignments as Prisma.Subject$teachingAssignmentsArgs

    expect(assignments.where).toEqual({
      deletedAt: null,
      semesterId: { in: [] },
    })
  })

  it('counts only the assignments it shows', () => {
    const include = buildSubjectInclude(SEMESTER_ID)
    const count = include._count as Prisma.SubjectCountOutputTypeDefaultArgs
    const assignments =
      include.teachingAssignments as Prisma.Subject$teachingAssignmentsArgs

    expect(count.select?.teachingAssignments).toEqual({
      where: assignments.where,
    })
  })
})

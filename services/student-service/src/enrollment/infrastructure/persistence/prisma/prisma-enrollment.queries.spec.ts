import { EnrollmentStatus } from '../../../../shared/domain/enums/enrollment-status.enum.js'
import { buildEnrollmentListWhere } from './prisma-enrollment.queries.js'

describe('buildEnrollmentListWhere', () => {
  it('always excludes soft-deleted rows', () => {
    expect(buildEnrollmentListWhere({})).toEqual({ deletedAt: null })
  })

  it('filters by student', () => {
    expect(buildEnrollmentListWhere({ studentId: 'stu-1' })).toEqual({
      deletedAt: null,
      studentId: 'stu-1',
    })
  })

  it('leaves the term open when none was resolved', () => {
    const where = buildEnrollmentListWhere({ studentId: 'stu-1' }, undefined)

    expect(where).not.toHaveProperty('semesterId')
  })

  it('applies a resolved term when there is one', () => {
    expect(buildEnrollmentListWhere({ studentId: 'stu-1' }, 'sem-1')).toEqual({
      deletedAt: null,
      studentId: 'stu-1',
      semesterId: 'sem-1',
    })
  })

  it('scopes an academic year to the terms it was given', () => {
    expect(
      buildEnrollmentListWhere({ academicYearId: 'ay-1' }, undefined, [
        'sem-1',
        'sem-2',
      ]),
    ).toEqual({
      deletedAt: null,
      semesterId: { in: ['sem-1', 'sem-2'] },
    })
  })

  it('matches nothing when the year has no terms', () => {
    expect(buildEnrollmentListWhere({ academicYearId: 'ay-1' })).toEqual({
      deletedAt: null,
      semesterId: { in: [] },
    })
  })

  it('keeps a term that falls inside the requested year', () => {
    expect(
      buildEnrollmentListWhere({ academicYearId: 'ay-1' }, 'sem-1', [
        'sem-1',
        'sem-2',
      ]),
    ).toEqual({
      deletedAt: null,
      semesterId: 'sem-1',
    })
  })

  it('matches nothing when the term falls outside the requested year', () => {
    expect(
      buildEnrollmentListWhere({ academicYearId: 'ay-1' }, 'sem-9', ['sem-1']),
    ).toEqual({
      deletedAt: null,
      semesterId: { in: [] },
    })
  })

  it('combines what it is given', () => {
    expect(
      buildEnrollmentListWhere(
        {
          studentId: 'stu-1',
          classroomId: 'cls-1',
          status: EnrollmentStatus.REPEATED,
        },
        'sem-1',
      ),
    ).toEqual({
      deletedAt: null,
      studentId: 'stu-1',
      classroomId: 'cls-1',
      status: EnrollmentStatus.REPEATED,
      semesterId: 'sem-1',
    })
  })
})

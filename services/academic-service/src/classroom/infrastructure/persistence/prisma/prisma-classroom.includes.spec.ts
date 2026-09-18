import {
  CLASSROOM_WITH_DETAILS_INCLUDE,
  classroomWithDetailsInclude,
} from './prisma-classroom.includes.js'

describe('classroom list include', () => {
  it('scopes the homeroom teacher to the resolved semester', () => {
    const include = classroomWithDetailsInclude('sem-1')

    expect(include.classroomSupervisors.where).toEqual({
      deletedAt: null,
      semesterId: 'sem-1',
    })
    expect(include.classroomSupervisors.take).toBe(1)
  })

  it('stays open when no semester resolves, rather than matching nothing', () => {
    const include = classroomWithDetailsInclude(null)

    expect(include.classroomSupervisors.where).toEqual({ deletedAt: null })
  })

  it('never reads a soft-deleted assignment', () => {
    for (const semesterId of ['sem-1', null, undefined]) {
      expect(
        classroomWithDetailsInclude(semesterId).classroomSupervisors.where,
      ).toMatchObject({ deletedAt: null })
    }
  })

  it('leaves the base constant unscoped', () => {
    expect(CLASSROOM_WITH_DETAILS_INCLUDE.classroomSupervisors.where).toEqual({
      deletedAt: null,
    })
  })
})

import { PrismaAttendanceRepository } from './prisma-attendance.repository.js'
import { buildAttendanceListWhere } from './prisma-attendance.where.js'
import type { PrismaService } from '../../../../core/database/prisma.service.js'
import type { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'

describe('attendance list scoping', () => {
  function repositoryWithSpy(enrollmentIds = ['enr-1']) {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    const prisma = {
      attendance: { findMany, count },
    } as unknown as PrismaService

    const search = jest
      .fn()
      .mockResolvedValue(enrollmentIds.map((id) => ({ id })))
    const enrollmentLookup = {
      search,
      listByIds: jest.fn().mockResolvedValue([]),
    } as unknown as IEnrollmentLookupPort

    const academicLookup = {
      listSchedules: jest.fn().mockResolvedValue([]),
      listTeachingAssignments: jest.fn().mockResolvedValue([]),
    } as unknown as IAcademicLookupPort

    return {
      repository: new PrismaAttendanceRepository(
        prisma,
        academicLookup,
        enrollmentLookup,
      ),
      findMany,
      search,
    }
  }

  it('sends the student scope alongside a classroom filter', async () => {
    const { repository, search } = repositoryWithSpy()

    await repository.findAll({
      page: 1,
      limit: 10,
      studentId: 'stu-1',
      classroomId: 'cls-9',
    })

    expect(search).toHaveBeenCalledWith({
      studentId: 'stu-1',
      classroomId: 'cls-9',
      semesterId: undefined,
    })
  })

  it('filters by the enrolments the scope resolved to', async () => {
    const { repository, findMany } = repositoryWithSpy(['enr-1', 'enr-2'])

    await repository.findAll({ page: 1, limit: 10, studentId: 'stu-1' })

    expect(findMany.mock.calls[0][0].where.enrollmentId).toEqual({
      in: ['enr-1', 'enr-2'],
    })
  })

  it('matches nothing when a scope resolves to no enrolment', async () => {
    const { repository, findMany } = repositoryWithSpy([])

    await repository.findAll({ page: 1, limit: 10, studentId: 'stu-1' })

    expect(findMany.mock.calls[0][0].where.enrollmentId).toEqual({ in: [] })
  })

  it('asks student-service nothing when one enrolment is already named', async () => {
    const { repository, findMany, search } = repositoryWithSpy()

    await repository.findAll({ page: 1, limit: 10, enrollmentId: 'enr-7' })

    expect(search).not.toHaveBeenCalled()
    expect(findMany.mock.calls[0][0].where.enrollmentId).toBe('enr-7')
  })
})

describe('buildAttendanceListWhere', () => {
  it('always excludes soft-deleted rows', () => {
    expect(buildAttendanceListWhere({}, null, null)).toEqual({
      deletedAt: null,
    })
  })

  it('separates an absent scope from an empty one', () => {
    expect(buildAttendanceListWhere({}, [], null).enrollmentId).toEqual({
      in: [],
    })
    expect(
      buildAttendanceListWhere({}, null, null).enrollmentId,
    ).toBeUndefined()
  })

  it('prefers a named enrolment over a resolved list', () => {
    const where = buildAttendanceListWhere(
      { enrollmentId: 'enr-1' },
      ['enr-2'],
      null,
    )

    expect(where.enrollmentId).toBe('enr-1')
  })
})

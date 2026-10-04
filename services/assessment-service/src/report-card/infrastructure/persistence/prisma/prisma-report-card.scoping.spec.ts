import { PrismaReportCardRepository } from './prisma-report-card.repository.js'
import type { PrismaService } from '../../../../core/database/prisma.service.js'
import type { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'

describe('report card list scoping', () => {
  function repositoryWithSpy(enrollmentIds = ['enr-1']) {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    const aggregate = jest
      .fn()
      .mockResolvedValue({ _avg: { totalAverage: null } })

    const prisma = {
      reportCard: { findMany, count, aggregate },
    } as unknown as PrismaService

    const search = jest
      .fn()
      .mockResolvedValue(enrollmentIds.map((id) => ({ id })))
    const enrollmentLookup = { search } as unknown as IEnrollmentLookupPort

    const findActiveSemester = jest
      .fn()
      .mockResolvedValue({ id: 'sem-active', academicYearId: 'ay-1' })
    const academicLookup = {
      findActiveSemester,
    } as unknown as IAcademicLookupPort

    return {
      repository: new PrismaReportCardRepository(
        prisma,
        academicLookup,
        enrollmentLookup,
      ),
      findMany,
      search,
      findActiveSemester,
    }
  }

  it('falls back to the active term when none is named', async () => {
    const { repository, search } = repositoryWithSpy()

    await repository.findAll({ page: 1, limit: 10, studentId: 'stu-1' })

    expect(search).toHaveBeenCalledWith({
      studentId: 'stu-1',
      classroomId: undefined,
      semesterId: 'sem-active',
    })
  })

  it('keeps the student scope alongside a classroom filter', async () => {
    const { repository, search } = repositoryWithSpy()

    await repository.findAll({
      page: 1,
      limit: 10,
      studentId: 'stu-1',
      classroomId: 'cls-1',
      semesterId: 'sem-9',
    })

    expect(search).toHaveBeenCalledWith({
      studentId: 'stu-1',
      classroomId: 'cls-1',
      semesterId: 'sem-9',
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

  it('omits the enrolment filter entirely when nothing scopes it', async () => {
    const { repository, findMany, findActiveSemester, search } =
      repositoryWithSpy()
    findActiveSemester.mockResolvedValue(null)

    await repository.findAll({ page: 1, limit: 10 })

    expect(search).not.toHaveBeenCalled()
    expect(findMany.mock.calls[0][0].where.enrollmentId).toBeUndefined()
  })
})

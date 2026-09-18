import { PrismaReportCardRepository } from './prisma-report-card.repository.js'
import type { PrismaService } from '../../../../core/database/prisma.service.js'
import type { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'

describe('report card list summary', () => {
  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValueOnce(32).mockResolvedValueOnce(12)
    const aggregate = jest
      .fn()
      .mockResolvedValue({ _avg: { totalAverage: 81.5 } })

    const prisma = {
      reportCard: { findMany, count, aggregate },
    } as unknown as PrismaService
    const academicLookup = {
      findActiveSemester: jest.fn().mockResolvedValue({ id: 'sem-1' }),
      listClassrooms: jest.fn().mockResolvedValue([]),
      listSemesters: jest.fn().mockResolvedValue([]),
    } as unknown as IAcademicLookupPort
    const enrollmentLookup = {
      search: jest.fn().mockResolvedValue([{ id: 'enr-1' }, { id: 'enr-2' }]),
      listByIds: jest.fn().mockResolvedValue([]),
    } as unknown as IEnrollmentLookupPort

    return {
      repository: new PrismaReportCardRepository(
        prisma,
        academicLookup,
        enrollmentLookup,
      ),
      findMany,
      count,
      aggregate,
    }
  }

  it('counts and averages the whole set, not the page', async () => {
    const { repository, findMany, count, aggregate } = repositoryWithSpies()

    const result = await repository.findAll({
      page: 2,
      limit: 10,
      classroomId: 'class-1',
    })

    expect(findMany.mock.calls[0][0]).toMatchObject({ skip: 10, take: 10 })

    for (const call of [...count.mock.calls, ...aggregate.mock.calls]) {
      expect(call[0]).not.toHaveProperty('skip')
      expect(call[0]).not.toHaveProperty('take')
    }

    expect(result.summary).toEqual({
      published: 12,
      draft: 20,
      averageScore: 81.5,
    })
    expect(result.total).toBe(32)
  })

  it('applies the same filter to the page and to the summary', async () => {
    const { repository, findMany, count, aggregate } = repositoryWithSpies()

    await repository.findAll({ page: 1, limit: 10, classroomId: 'class-1' })

    const pageWhere = findMany.mock.calls[0][0].where
    expect(count.mock.calls[0][0].where).toEqual(pageWhere)
    expect(aggregate.mock.calls[0][0].where).toEqual(pageWhere)

    expect(count.mock.calls[1][0].where).toEqual({
      ...pageWhere,
      isPublished: true,
    })
  })

  it('reports no average rather than zero when nothing is generated yet', async () => {
    const { repository } = repositoryWithSpies()
    const prisma = (
      repository as unknown as {
        prisma: { reportCard: { aggregate: jest.Mock } }
      }
    ).prisma
    prisma.reportCard.aggregate.mockResolvedValue({
      _avg: { totalAverage: null },
    })

    const result = await repository.findAll({ page: 1, limit: 10 })

    expect(result.summary?.averageScore).toBeNull()
  })
})

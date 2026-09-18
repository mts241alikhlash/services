import { PrismaClient } from '@prisma/client'
import { findSchedulePage } from './prisma-schedule.queries.js'

describe('schedule page scoping', () => {
  function prismaWithSpy() {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    return {
      prisma: { schedule: { findMany, count } } as unknown as PrismaClient,
      findMany,
    }
  }

  it('keeps the live-academic-year filter and the employee scope together', async () => {
    const { prisma, findMany } = prismaWithSpy()

    await findSchedulePage(prisma as never, {
      page: 1,
      limit: 10,
      employeeId: 'tea-1',
    })

    const where = findMany.mock.calls[0][0].where
    expect(where.teachingAssignment).toBeDefined()
    expect(where.AND).toEqual([{ teachingAssignment: { employeeId: 'tea-1' } }])
  })

  it('keeps the employee scope when the caller names an assignment', async () => {
    const { prisma, findMany } = prismaWithSpy()

    await findSchedulePage(prisma as never, {
      page: 1,
      limit: 10,
      employeeId: 'tea-1',
      teachingAssignmentId: 'ta-of-someone-else',
    })

    const where = findMany.mock.calls[0][0].where
    expect(where.teachingAssignmentId).toBe('ta-of-someone-else')
    expect(where.AND).toEqual([{ teachingAssignment: { employeeId: 'tea-1' } }])
  })

  it('adds no scope when none is asked for', async () => {
    const { prisma, findMany } = prismaWithSpy()

    await findSchedulePage(prisma as never, { page: 1, limit: 10 })

    expect(findMany.mock.calls[0][0].where.AND).toBeUndefined()
  })
})

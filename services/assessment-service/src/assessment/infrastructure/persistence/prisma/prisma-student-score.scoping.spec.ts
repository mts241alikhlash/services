import { PrismaStudentScoreRepository } from './prisma-student-score.repository.js'
import type { PrismaService } from '../../../../core/database/prisma.service.js'
import type { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import type { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'

describe('student score list scoping', () => {
  function repositoryWithSpy() {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(0)
    const prisma = {
      studentScore: { findMany, count },
    } as unknown as PrismaService
    const profileLookupPort = {
      findByUserIds: jest.fn().mockResolvedValue([]),
    } as unknown as IProfileLookupPort
    const academicLookup = {
      listClassrooms: jest.fn().mockResolvedValue([]),
      listSemesters: jest.fn().mockResolvedValue([]),
    } as unknown as IAcademicLookupPort
    const search = jest
      .fn()
      .mockResolvedValue([{ id: 'enr-1' }, { id: 'enr-2' }])
    const enrollmentLookup = {
      search,
      listByIds: jest.fn().mockResolvedValue([]),
    } as unknown as IEnrollmentLookupPort

    return {
      repository: new PrismaStudentScoreRepository(
        prisma,
        profileLookupPort,
        academicLookup,
        enrollmentLookup,
      ),
      findMany,
      search,
    }
  }

  it('reaches the student through the enrolment', async () => {
    const { repository, findMany, search } = repositoryWithSpy()

    await repository.findAll({ page: 1, limit: 10, studentId: 'stu-1' })

    expect(search).toHaveBeenCalledWith({
      studentId: 'stu-1',
      classroomId: undefined,
      semesterId: undefined,
    })
    expect(findMany.mock.calls[0][0].where.enrollmentId).toEqual({
      in: ['enr-1', 'enr-2'],
    })
  })

  it('keeps the student scope when the caller also names an enrolment', async () => {
    const { repository, findMany, search } = repositoryWithSpy()

    await repository.findAll({
      page: 1,
      limit: 10,
      studentId: 'stu-1',
      enrollmentId: 'enr-of-someone-else',
    })

    expect(search).toHaveBeenCalledWith({
      studentId: 'stu-1',
      classroomId: undefined,
      semesterId: undefined,
    })
    expect(findMany.mock.calls[0][0].where.enrollmentId).toEqual({ in: [] })
  })

  it('narrows to the named enrolment when it is one of the student’s own', async () => {
    const { repository, findMany } = repositoryWithSpy()

    await repository.findAll({
      page: 1,
      limit: 10,
      studentId: 'stu-1',
      enrollmentId: 'enr-2',
    })

    expect(findMany.mock.calls[0][0].where.enrollmentId).toBe('enr-2')
  })

  it('honours classroom and semester, which it used to declare and drop', async () => {
    const { repository, search } = repositoryWithSpy()

    await repository.findAll({
      page: 1,
      limit: 10,
      classroomId: 'cls-1',
      semesterId: 'sem-1',
    })

    expect(search).toHaveBeenCalledWith({
      classroomId: 'cls-1',
      semesterId: 'sem-1',
      studentId: undefined,
    })
  })

  it('adds no enrolment clause when nothing needs one', async () => {
    const { repository, findMany, search } = repositoryWithSpy()

    await repository.findAll({ page: 1, limit: 10 })

    expect(search).not.toHaveBeenCalled()
    expect(findMany.mock.calls[0][0].where.enrollmentId).toBeUndefined()
  })
})

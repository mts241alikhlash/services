import { ForbiddenException } from '@nestjs/common'
import { GradeAssignedStudentScoresUseCase } from './grade-assigned-student-scores.use-case.js'
import { BulkUpsertStudentScoresUseCase } from '../bulk-upsert-student-scores/bulk-upsert-student-scores.use-case.js'

describe('GradeAssignedStudentScoresUseCase', () => {
  const USER = 'user-1'
  const EMPLOYEE = 'employee-1'
  const ITEM = 'item-1'

  function makeUseCase(options: {
    employeeId?: string | null
    teaches?: boolean
    supervises?: boolean | boolean[]
  }) {
    const execute = jest.fn().mockResolvedValue({ saved: 1 })

    const supervisesQueue = Array.isArray(options.supervises)
      ? [...options.supervises]
      : null
    const supervisesEnrollment = jest.fn().mockImplementation(() => {
      if (supervisesQueue) return Promise.resolve(supervisesQueue.shift())
      return Promise.resolve(options.supervises ?? false)
    })

    const useCase = new GradeAssignedStudentScoresUseCase(
      { execute } as unknown as BulkUpsertStudentScoresUseCase,
      {
        findEmployeeIdByUserId: jest
          .fn()
          .mockResolvedValue(
            options.employeeId === undefined ? EMPLOYEE : options.employeeId,
          ),
        employeeExists: jest.fn().mockResolvedValue(true),
      },
      {
        teachesAssessmentItem: jest
          .fn()
          .mockResolvedValue(options.teaches ?? false),
        supervisesEnrollment,
      },
    )

    return { useCase, execute, supervisesEnrollment }
  }

  const input = (...enrollmentIds: string[]) => ({
    assessmentItemId: ITEM,
    records: enrollmentIds.map((enrollmentId) => ({
      enrollmentId,
      score: 80,
    })),
  })

  describe('the subject you teach', () => {
    it('saves, and does not mark it as a correction', async () => {
      const { useCase, execute } = makeUseCase({ teaches: true })

      await useCase.execute(input('enr-1', 'enr-2'), USER)

      expect(execute).toHaveBeenCalledWith(input('enr-1', 'enr-2'))
    })

    it('does not ask about supervision it does not need', async () => {
      const { useCase, supervisesEnrollment } = makeUseCase({ teaches: true })

      await useCase.execute(input('enr-1'), USER)

      expect(supervisesEnrollment).not.toHaveBeenCalled()
    })
  })

  describe('the class you supervise', () => {
    it('saves, recorded as a correction by the caller', async () => {
      const { useCase, execute } = makeUseCase({
        teaches: false,
        supervises: true,
      })

      await useCase.execute(input('enr-1'), USER)

      expect(execute).toHaveBeenCalledWith(input('enr-1'), USER)
    })

    it('refuses a roster that mixes their class with another', async () => {
      const { useCase, execute } = makeUseCase({
        teaches: false,
        supervises: [true, false],
      })

      await expect(
        useCase.execute(input('mine', 'theirs'), USER),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(execute).not.toHaveBeenCalled()
    })
  })

  describe('neither', () => {
    it('refuses a subject the caller does not teach', async () => {
      const { useCase, execute } = makeUseCase({
        teaches: false,
        supervises: false,
      })

      await expect(
        useCase.execute(input('enr-1'), USER),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(execute).not.toHaveBeenCalled()
    })

    it('refuses a caller with no teaching record', async () => {
      const { useCase, execute } = makeUseCase({
        employeeId: null,
        teaches: true,
        supervises: true,
      })

      await expect(
        useCase.execute(input('enr-1'), USER),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(execute).not.toHaveBeenCalled()
    })
  })
})

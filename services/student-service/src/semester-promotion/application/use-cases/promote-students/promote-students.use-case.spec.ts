import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PromotionAction } from '../../../domain/enums/promotion-action.enum.js'
import { IPromotionRepository } from '../../../domain/repositories/promotion.repository.js'
import { PromotionSemesterResolver } from '../../services/promotion-semester-resolver.service.js'
import type { PromoteStudentsInput } from './promote-students.input.js'
import { PromoteStudentsUseCase } from './promote-students.use-case.js'

describe('PromoteStudentsUseCase', () => {
  let useCase: PromoteStudentsUseCase

  const mockRepository: Record<string, jest.Mock> = {
    findEdgeSemesterOfAcademicYear: jest.fn(),
    findLatestEnrolledSemesterOfAcademicYear: jest.fn(),
    findAcademicYearName: jest.fn(),
    findClassroomById: jest.fn(),
    executePromotion: jest.fn(),
  }

  const sourceSemester = {
    id: 'sem-src',
    academicYearId: 'ay-old',
    academicYear: { id: 'ay-old', name: '2024/2025' },
  }

  const targetSemester = {
    id: 'sem-tgt',
    academicYearId: 'ay-new',
    academicYear: { id: 'ay-new', name: '2025/2026' },
  }

  const makeClassroom = (
    id: string,
    level: number,
    levelName: string,
    code: string,
    ayId: string,
  ) => ({
    id,
    code,
    name: code,
    gradeId: `lvl-${level}`,
    grade: { level, name: levelName },
    academicYearId: ayId,
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoteStudentsUseCase,
        { provide: IPromotionRepository, useValue: mockRepository },
        PromotionSemesterResolver,
      ],
    }).compile()

    useCase = module.get(PromoteStudentsUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  it('should promote students successfully', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(
      targetSemester,
    )

    mockRepository.findClassroomById
      .mockResolvedValueOnce(
        makeClassroom('cls-7a', 7, 'VII', 'VII-A', 'ay-old'),
      )
      .mockResolvedValueOnce(
        makeClassroom('cls-8a', 8, 'VIII', 'VIII-A', 'ay-new'),
      )

    mockRepository.executePromotion.mockResolvedValue({
      promoted: 1,
      repeated: 0,
      skipped: 0,
    })

    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-7a',
          targetClassroomId: 'cls-8a',
          action: PromotionAction.PROMOTE,
        },
      ],
    }

    const result = await useCase.execute(input)
    expect(result.promoted).toBe(1)
    expect(mockRepository.executePromotion).toHaveBeenCalledWith(
      'sem-src',
      'sem-tgt',
      input.students,
    )
  })

  it('should handle repeat with decline reason', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(
      targetSemester,
    )

    mockRepository.findClassroomById
      .mockResolvedValueOnce(
        makeClassroom('cls-7a-old', 7, 'VII', 'VII-A', 'ay-old'),
      )
      .mockResolvedValueOnce(
        makeClassroom('cls-7a-new', 7, 'VII', 'VII-A', 'ay-new'),
      )

    mockRepository.executePromotion.mockResolvedValue({
      promoted: 0,
      repeated: 1,
      skipped: 0,
    })

    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-7a-old',
          targetClassroomId: 'cls-7a-new',
          action: PromotionAction.REPEAT,
          declineReason: 'Nilai di bawah rata-rata',
        },
      ],
    }

    const result = await useCase.execute(input)
    expect(result.repeated).toBe(1)
  })

  it('refuses a source year whose terms are all empty, and says so', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      null,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
    mockRepository.findAcademicYearName.mockResolvedValue('2026/2027')

    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-1',
          targetClassroomId: 'cls-2',
          action: PromotionAction.PROMOTE,
        },
      ],
    }

    await expect(useCase.execute(input)).rejects.toThrow(
      /no students enrolled/i,
    )
    await expect(useCase.execute(input)).rejects.toThrow(/2026\/2027/)
  })

  it('refuses a source academic year that has no term to read from', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      null,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(null)
    mockRepository.findAcademicYearName.mockResolvedValue('2024/2025')

    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-1',
          targetClassroomId: 'cls-2',
          action: PromotionAction.PROMOTE,
        },
      ],
    }

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
  })

  it('refuses both years being the same, and points at rollover', async () => {
    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-old',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-1',
          targetClassroomId: 'cls-2',
          action: PromotionAction.PROMOTE,
        },
      ],
    }

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
    expect(mockRepository.findEdgeSemesterOfAcademicYear).not.toHaveBeenCalled()
  })

  it('should throw if target classroom is in wrong AY', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(
      targetSemester,
    )

    mockRepository.findClassroomById
      .mockResolvedValueOnce(
        makeClassroom('cls-7a', 7, 'VII', 'VII-A', 'ay-old'),
      )
      .mockResolvedValueOnce(
        makeClassroom('cls-8a-wrong', 8, 'VIII', 'VIII-A', 'ay-old'),
      )

    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-7a',
          targetClassroomId: 'cls-8a-wrong',
          action: PromotionAction.PROMOTE,
        },
      ],
    }

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
  })

  it('should throw if REPEAT with level mismatch', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(
      targetSemester,
    )

    mockRepository.findClassroomById
      .mockResolvedValueOnce(
        makeClassroom('cls-7a', 7, 'VII', 'VII-A', 'ay-old'),
      )
      .mockResolvedValueOnce(
        makeClassroom('cls-8a', 8, 'VIII', 'VIII-A', 'ay-new'),
      )

    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-7a',
          targetClassroomId: 'cls-8a',
          action: PromotionAction.REPEAT,
          declineReason: 'Nilai rendah',
        },
      ],
    }

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
  })

  it('should throw if an action has no targetClassroomId', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(
      targetSemester,
    )

    mockRepository.findClassroomById.mockResolvedValueOnce(
      makeClassroom('cls-9a', 9, 'IX', 'IX-A', 'ay-old'),
    )

    const input = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-9a',
          action: PromotionAction.PROMOTE,
        },
      ],
    } as unknown as PromoteStudentsInput

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
  })

  it('should throw if REPEAT without declineReason', async () => {
    mockRepository.findLatestEnrolledSemesterOfAcademicYear.mockResolvedValue(
      sourceSemester,
    )
    mockRepository.findEdgeSemesterOfAcademicYear.mockResolvedValue(
      targetSemester,
    )

    mockRepository.findClassroomById.mockResolvedValueOnce(
      makeClassroom('cls-7a', 7, 'VII', 'VII-A', 'ay-old'),
    )

    const input: PromoteStudentsInput = {
      sourceAcademicYearId: 'ay-old',
      targetAcademicYearId: 'ay-new',
      students: [
        {
          studentId: 'stu-1',
          sourceClassroomId: 'cls-7a',
          targetClassroomId: 'cls-7a-new',
          action: PromotionAction.REPEAT,
        },
      ],
    }

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
  })
})

import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IRolloverRepository } from '../../../domain/repositories/rollover.repository.js'
import type { RolloverSemesterInput } from './rollover-semester.input.js'
import { RolloverSemesterUseCase } from './rollover-semester.use-case.js'

describe('RolloverSemesterUseCase', () => {
  let useCase: RolloverSemesterUseCase

  const mockRolloverRepository = {
    findSemesterWithAcademicYear: jest.fn(),
    fetchSourceData: jest.fn(),
    executeRollover: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolloverSemesterUseCase,
        { provide: IRolloverRepository, useValue: mockRolloverRepository },
      ],
    }).compile()

    useCase = module.get<RolloverSemesterUseCase>(RolloverSemesterUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const sourceSemester = {
      id: 'sem-source',
      academicYearId: 'ay-1',
      typeId: 'type-odd',
    }

    const targetSemester = {
      id: 'sem-target',
      academicYearId: 'ay-1',
      typeId: 'type-even',
    }

    const input: RolloverSemesterInput = {
      sourceSemesterId: 'sem-source',
      targetSemesterId: 'sem-target',
    }

    const emptySourceData = {
      classrooms: [],
      enrollments: [],
      supervisors: [],
      assignments: [],
    }

    const defaultSummary = {
      classrooms: { created: 0, skipped: 0 },
      enrollments: { created: 0, skipped: 0 },
      supervisors: { created: 0, skipped: 0 },
      teachingAssignments: { created: 0, skipped: 0 },
      schedules: { created: 0, skipped: 0 },
    }

    it('should throw BadRequestException when source equals target', async () => {
      const sameInput: RolloverSemesterInput = {
        sourceSemesterId: 'sem-1',
        targetSemesterId: 'sem-1',
      }

      await expect(useCase.execute(sameInput)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should throw NotFoundException when source semester not found', async () => {
      mockRolloverRepository.findSemesterWithAcademicYear
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(targetSemester)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException when target semester not found', async () => {
      mockRolloverRepository.findSemesterWithAcademicYear
        .mockResolvedValueOnce(sourceSemester)
        .mockResolvedValueOnce(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when semesters are in different academic years', async () => {
      const crossAyTarget = {
        id: 'sem-target',
        academicYearId: 'ay-2',
        typeId: 'type-odd',
      }
      mockRolloverRepository.findSemesterWithAcademicYear
        .mockResolvedValueOnce(sourceSemester)
        .mockResolvedValueOnce(crossAyTarget)

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when semesters have the same type', async () => {
      const sameTypeTarget = {
        id: 'sem-target',
        academicYearId: 'ay-1',
        typeId: 'type-odd',
      }
      mockRolloverRepository.findSemesterWithAcademicYear
        .mockResolvedValueOnce(sourceSemester)
        .mockResolvedValueOnce(sameTypeTarget)

      await expect(useCase.execute(input)).rejects.toThrow(BadRequestException)
    })

    it('should rollover successfully', async () => {
      mockRolloverRepository.findSemesterWithAcademicYear
        .mockResolvedValueOnce(sourceSemester)
        .mockResolvedValueOnce(targetSemester)

      const sourceData = {
        classrooms: [{ id: 'cls-1' }],
        supervisors: [{ id: 'sup-1' }],
        assignments: [{ id: 'ta-1' }],
      }

      const summary = {
        classrooms: { created: 1, skipped: 0 },
        enrollments: { created: 1, skipped: 0 },
        supervisors: { created: 1, skipped: 0 },
        teachingAssignments: { created: 1, skipped: 0 },
        schedules: { created: 1, skipped: 0 },
      }

      mockRolloverRepository.fetchSourceData.mockResolvedValue(sourceData)
      mockRolloverRepository.executeRollover.mockResolvedValue(summary)

      const result = await useCase.execute(input)

      expect(mockRolloverRepository.fetchSourceData).toHaveBeenCalledWith(
        'sem-source',
        'ay-1',
      )
      expect(mockRolloverRepository.executeRollover).toHaveBeenCalledWith(
        sourceData,
        'sem-target',
        'ay-1',
        'sem-source',
      )
      expect(result.classrooms.created).toBe(1)
      expect(result.enrollments.created).toBe(1)
      expect(result.supervisors.created).toBe(1)
      expect(result.teachingAssignments.created).toBe(1)
      expect(result.schedules.created).toBe(1)
    })

    it('should handle empty source data gracefully', async () => {
      mockRolloverRepository.findSemesterWithAcademicYear
        .mockResolvedValueOnce(sourceSemester)
        .mockResolvedValueOnce(targetSemester)

      mockRolloverRepository.fetchSourceData.mockResolvedValue(emptySourceData)
      mockRolloverRepository.executeRollover.mockResolvedValue(defaultSummary)

      const result = await useCase.execute(input)

      expect(result.classrooms.created).toBe(0)
      expect(result.classrooms.skipped).toBe(0)
      expect(result.enrollments.created).toBe(0)
      expect(result.supervisors.created).toBe(0)
      expect(result.teachingAssignments.created).toBe(0)
      expect(result.schedules.created).toBe(0)
    })
  })
})

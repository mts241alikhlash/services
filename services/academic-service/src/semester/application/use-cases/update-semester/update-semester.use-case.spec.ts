import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import type { UpdateSemesterInput } from './update-semester.input.js'
import { UpdateSemesterUseCase } from './update-semester.use-case.js'

describe('UpdateSemesterUseCase', () => {
  let useCase: UpdateSemesterUseCase

  const mockSemesterRepository: Record<string, jest.Mock> = {
    findById: jest.fn(),
    findFirstDependent: jest.fn(),
    findTypeById: jest.fn(),
    findByAcademicYearAndType: jest.fn(),
    update: jest.fn(),
  }
  const mockAcademicYearRepository: Record<string, jest.Mock> = {
    findById: jest.fn(),
  }

  const currentSemester = {
    id: 'sem-1',
    academicYearId: 'ay-1',
    typeId: 'type-1',
    startDate: null,
    endDate: null,
    isActive: false,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSemesterUseCase,
        { provide: ISemesterRepository, useValue: mockSemesterRepository },
        {
          provide: IAcademicYearRepository,
          useValue: mockAcademicYearRepository,
        },
      ],
    }).compile()

    useCase = module.get<UpdateSemesterUseCase>(UpdateSemesterUseCase)
    jest.clearAllMocks()
    mockSemesterRepository.findFirstDependent.mockResolvedValue(null)
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'sem-1'

    it('should update dates without touching academicYearId/typeId checks', async () => {
      const input: UpdateSemesterInput = {
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-12-01'),
      }
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockSemesterRepository.update.mockResolvedValue({
        ...currentSemester,
        ...input,
      })

      await useCase.execute(id, input)

      expect(
        mockSemesterRepository.findByAcademicYearAndType,
      ).not.toHaveBeenCalled()
      expect(mockAcademicYearRepository.findById).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when semester does not exist', async () => {
      mockSemesterRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, {})).rejects.toThrow(NotFoundException)
    })

    it('should refuse to move academicYearId when the semester has dependents', async () => {
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockSemesterRepository.findFirstDependent.mockResolvedValue(
        'student enrolments',
      )

      await expect(
        useCase.execute(id, { academicYearId: 'ay-2' }),
      ).rejects.toThrow(ConflictException)
      expect(mockSemesterRepository.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when moving to a nonexistent academic year', async () => {
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockAcademicYearRepository.findById.mockResolvedValue(null)

      await expect(
        useCase.execute(id, { academicYearId: 'ay-2' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ConflictException when the new (year, type) pair already exists', async () => {
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockSemesterRepository.findTypeById.mockResolvedValue({
        id: 'type-2',
        name: 'Genap',
      })
      mockSemesterRepository.findByAcademicYearAndType.mockResolvedValue({
        id: 'other-sem',
      })

      await expect(useCase.execute(id, { typeId: 'type-2' })).rejects.toThrow(
        ConflictException,
      )
      expect(mockSemesterRepository.update).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when the resulting date range is invalid', async () => {
      mockSemesterRepository.findById.mockResolvedValue({
        ...currentSemester,
        startDate: new Date('2025-08-01'),
      })

      await expect(
        useCase.execute(id, { endDate: new Date('2025-07-01') }),
      ).rejects.toThrow(BadRequestException)
      expect(mockSemesterRepository.update).not.toHaveBeenCalled()
    })

    it('should refuse to move typeId when the semester has dependents', async () => {
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockSemesterRepository.findFirstDependent.mockResolvedValue(
        'teaching assignments',
      )

      await expect(useCase.execute(id, { typeId: 'type-2' })).rejects.toThrow(
        ConflictException,
      )
      expect(mockSemesterRepository.update).not.toHaveBeenCalled()
    })

    it('should name what is holding the semester in the conflict message', async () => {
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockSemesterRepository.findFirstDependent.mockResolvedValue(
        'homeroom teachers',
      )

      const message = await useCase
        .execute(id, { academicYearId: 'ay-2' })
        .catch((error: Error) => error.message)

      expect(message).toContain('homeroom teachers')
    })

    it('should not be tripped by resubmitting the current academicYearId and typeId', async () => {
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockSemesterRepository.findFirstDependent.mockResolvedValue(
        'student enrolments',
      )
      mockSemesterRepository.findTypeById.mockResolvedValue({
        id: 'type-1',
        name: 'Ganjil',
      })
      mockSemesterRepository.findByAcademicYearAndType.mockResolvedValue({
        id: 'sem-1',
      })
      mockSemesterRepository.update.mockResolvedValue(currentSemester)

      await useCase.execute(id, {
        academicYearId: currentSemester.academicYearId,
        typeId: currentSemester.typeId,
      })

      expect(mockSemesterRepository.findFirstDependent).not.toHaveBeenCalled()
      expect(mockSemesterRepository.update).toHaveBeenCalled()
    })

    it('should allow moving academicYearId while the semester is still empty', async () => {
      mockSemesterRepository.findById.mockResolvedValue(currentSemester)
      mockSemesterRepository.findFirstDependent.mockResolvedValue(null)
      mockAcademicYearRepository.findById.mockResolvedValue({
        id: 'ay-2',
        name: '2026/2027',
      })
      mockSemesterRepository.findTypeById.mockResolvedValue({
        id: 'type-1',
        name: 'Ganjil',
      })
      mockSemesterRepository.findByAcademicYearAndType.mockResolvedValue(null)
      mockSemesterRepository.update.mockResolvedValue({
        ...currentSemester,
        academicYearId: 'ay-2',
      })

      await useCase.execute(id, { academicYearId: 'ay-2' })

      expect(mockSemesterRepository.update).toHaveBeenCalled()
    })
  })
})

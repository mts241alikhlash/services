import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import type { CreateSemesterInput } from './create-semester.input.js'
import { CreateSemesterUseCase } from './create-semester.use-case.js'

describe('CreateSemesterUseCase', () => {
  let useCase: CreateSemesterUseCase

  const mockSemesterRepository: Record<string, jest.Mock> = {
    findTypeById: jest.fn(),
    findByAcademicYearAndType: jest.fn(),
    deactivateAll: jest.fn(),
    create: jest.fn(),
  }
  const mockAcademicYearRepository: Record<string, jest.Mock> = {
    findById: jest.fn(),
  }

  const academicYear = { id: 'ay-1', name: '2025/2026' }
  const semesterType = { id: 'type-1', name: 'Ganjil' }
  const createdSemester = {
    id: 'sem-1',
    academicYearId: 'ay-1',
    typeId: 'type-1',
    isActive: false,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSemesterUseCase,
        { provide: ISemesterRepository, useValue: mockSemesterRepository },
        {
          provide: IAcademicYearRepository,
          useValue: mockAcademicYearRepository,
        },
      ],
    }).compile()

    useCase = module.get<CreateSemesterUseCase>(CreateSemesterUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateSemesterInput = {
      academicYearId: 'ay-1',
      typeId: 'type-1',
    }

    it('should create a semester', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue(academicYear)
      mockSemesterRepository.findTypeById.mockResolvedValue(semesterType)
      mockSemesterRepository.findByAcademicYearAndType.mockResolvedValue(null)
      mockSemesterRepository.create.mockResolvedValue(createdSemester)

      const result = await useCase.execute(input)

      expect(mockSemesterRepository.create).toHaveBeenCalledWith({
        academicYearId: 'ay-1',
        typeId: 'type-1',
        isActive: false,
      })
      expect(result).toEqual(createdSemester)
    })

    it('should throw NotFoundException when academic year does not exist', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
      expect(mockSemesterRepository.create).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when semester type does not exist', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue(academicYear)
      mockSemesterRepository.findTypeById.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
      expect(mockSemesterRepository.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when the type already exists for the year', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue(academicYear)
      mockSemesterRepository.findTypeById.mockResolvedValue(semesterType)
      mockSemesterRepository.findByAcademicYearAndType.mockResolvedValue({
        id: 'existing',
      })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockSemesterRepository.create).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when endDate is not after startDate', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue(academicYear)
      mockSemesterRepository.findTypeById.mockResolvedValue(semesterType)
      mockSemesterRepository.findByAcademicYearAndType.mockResolvedValue(null)

      await expect(
        useCase.execute({
          ...input,
          startDate: new Date('2025-08-01'),
          endDate: new Date('2025-07-01'),
        }),
      ).rejects.toThrow(BadRequestException)
      expect(mockSemesterRepository.create).not.toHaveBeenCalled()
    })

    it('should deactivate all other semesters when isActive is true', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue(academicYear)
      mockSemesterRepository.findTypeById.mockResolvedValue(semesterType)
      mockSemesterRepository.findByAcademicYearAndType.mockResolvedValue(null)
      mockSemesterRepository.deactivateAll.mockResolvedValue({ count: 1 })
      mockSemesterRepository.create.mockResolvedValue({
        ...createdSemester,
        isActive: true,
      })

      await useCase.execute({ ...input, isActive: true })

      expect(mockSemesterRepository.deactivateAll).toHaveBeenCalledWith()
    })
  })
})

import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ICurriculumRepository } from '../../../domain/repositories/curriculum.repository.js'
import type { CreateCurriculumInput } from './create-curriculum.input.js'
import { CreateCurriculaUseCase } from './create-curriculum.use-case.js'

describe('CreateCurriculaUseCase', () => {
  let useCase: CreateCurriculaUseCase

  const mockRepository = {
    findByNameAndAcademicYear: jest.fn(),
    create: jest.fn(),
  }

  const mockAcademicYearsRepository = {
    findById: jest.fn(),
  }

  const mockAcademicYear = {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: '2024/2025',
  }

  const input: CreateCurriculumInput = {
    academicYearId: '550e8400-e29b-41d4-a716-446655440009',
    name: 'Kurikulum Merdeka',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCurriculaUseCase,
        { provide: ICurriculumRepository, useValue: mockRepository },
        {
          provide: IAcademicYearRepository,
          useValue: mockAcademicYearsRepository,
        },
      ],
    }).compile()

    useCase = module.get<CreateCurriculaUseCase>(CreateCurriculaUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const mockCurricula = {
      id: 'curr-uuid-1',
      name: 'Kurikulum Merdeka',
      academicYearId: input.academicYearId,
    }

    it('should create a curricula successfully', async () => {
      mockAcademicYearsRepository.findById.mockResolvedValue(mockAcademicYear)
      mockRepository.findByNameAndAcademicYear.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockCurricula)

      const result = await useCase.execute(input)

      expect(mockAcademicYearsRepository.findById).toHaveBeenCalledWith(
        input.academicYearId,
      )
      expect(mockRepository.findByNameAndAcademicYear).toHaveBeenCalledWith(
        input.name,
        input.academicYearId,
      )
      expect(mockRepository.create).toHaveBeenCalledWith({
        academicYearId: input.academicYearId,
        name: input.name,
        isActive: undefined,
      })
      expect(result).toEqual(mockCurricula)
    })

    it('should throw NotFoundException when academic year does not exist', async () => {
      mockAcademicYearsRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
      expect(mockRepository.findByNameAndAcademicYear).not.toHaveBeenCalled()
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when curricula name already exists in the academic year', async () => {
      mockAcademicYearsRepository.findById.mockResolvedValue(mockAcademicYear)
      mockRepository.findByNameAndAcademicYear.mockResolvedValue({
        id: 'existing-id',
        name: 'Kurikulum Merdeka',
      })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should pass isActive when provided', async () => {
      const inputWithActive: CreateCurriculumInput = {
        ...input,
        isActive: false,
      }
      mockAcademicYearsRepository.findById.mockResolvedValue(mockAcademicYear)
      mockRepository.findByNameAndAcademicYear.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockCurricula)

      await useCase.execute(inputWithActive)

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      )
    })
  })
})

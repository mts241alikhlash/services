import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'
import type { UpdateAcademicYearInput } from './update-academic-year.input.js'
import { UpdateAcademicYearUseCase } from './update-academic-year.use-case.js'

describe('UpdateAcademicYearUseCase', () => {
  let useCase: UpdateAcademicYearUseCase

  const mockRepository = {
    findById: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAcademicYearUseCase,
        { provide: IAcademicYearRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<UpdateAcademicYearUseCase>(UpdateAcademicYearUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'ay-1'
    const currentYear = {
      id: 'ay-1',
      name: '2024/2025',
      startYear: 2024,
      isActive: false,
    }

    it('should update an academic year successfully', async () => {
      const input: UpdateAcademicYearInput = { name: '2025/2026' }
      const updatedYear = { ...currentYear, name: '2025/2026' }

      mockRepository.findById.mockResolvedValue(currentYear)
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.update.mockResolvedValue(updatedYear)

      const result = await useCase.execute(id, input)

      expect(mockRepository.findById).toHaveBeenCalledWith(id)
      expect(mockRepository.findByName).toHaveBeenCalledWith('2025/2026')
      expect(mockRepository.update).toHaveBeenCalledWith(id, {
        name: '2025/2026',
        startYear: undefined,
      })
      expect(result).toEqual(updatedYear)
    })

    it('should carry startYear through to the repository when given', async () => {
      const input: UpdateAcademicYearInput = { startYear: 2027 }
      mockRepository.findById.mockResolvedValue(currentYear)
      mockRepository.update.mockResolvedValue({
        ...currentYear,
        startYear: 2027,
      })

      await useCase.execute(id, input)

      expect(mockRepository.update).toHaveBeenCalledWith(id, {
        name: undefined,
        startYear: 2027,
      })
    })

    it('should throw NotFoundException when ID not found', async () => {
      const input: UpdateAcademicYearInput = { name: '2025/2026' }
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when new name is taken', async () => {
      const input: UpdateAcademicYearInput = { name: 'Taken Name' }
      mockRepository.findById.mockResolvedValue(currentYear)
      mockRepository.findByName.mockResolvedValue({
        id: 'other-id',
        name: 'Taken Name',
      })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should skip name uniqueness check when name is unchanged', async () => {
      const input: UpdateAcademicYearInput = { name: '2024/2025' }
      mockRepository.findById.mockResolvedValue(currentYear)
      mockRepository.update.mockResolvedValue(currentYear)

      await useCase.execute(id, input)

      expect(mockRepository.findByName).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException for a startYear out of range', async () => {
      mockRepository.findById.mockResolvedValue(currentYear)

      await expect(useCase.execute(id, { startYear: 3000 })).rejects.toThrow(
        BadRequestException,
      )
      expect(mockRepository.update).not.toHaveBeenCalled()
    })
  })
})

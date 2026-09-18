import { BadRequestException, ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'
import type { CreateAcademicYearInput } from './create-academic-year.input.js'
import { CreateAcademicYearUseCase } from './create-academic-year.use-case.js'

describe('CreateAcademicYearUseCase', () => {
  let useCase: CreateAcademicYearUseCase

  const mockRepository: Record<string, jest.Mock> = {
    findByName: jest.fn(),
    deactivateAll: jest.fn(),
    create: jest.fn(),
  }

  const mockAcademicYear = {
    id: 'ay-1',
    name: '2025/2026',
    isActive: false,
    deletedAt: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAcademicYearUseCase,
        { provide: IAcademicYearRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<CreateAcademicYearUseCase>(CreateAcademicYearUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateAcademicYearInput = {
      name: '2025/2026',
      startYear: 2025,
    }

    it('should create academic year', async () => {
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockAcademicYear)

      const result = await useCase.execute(input)

      expect(mockRepository.findByName).toHaveBeenCalledWith('2025/2026')
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: '2025/2026',
        startYear: 2025,
        isActive: false,
      })
      expect(result.name).toBe('2025/2026')
    })

    it('should throw ConflictException when name already exists', async () => {
      mockRepository.findByName.mockResolvedValue({
        id: 'existing-id',
        name: '2025/2026',
      })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should deactivate all others when isActive is true', async () => {
      const activeInput: CreateAcademicYearInput = {
        name: '2025/2026',
        startYear: 2025,
        isActive: true,
      }

      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.deactivateAll.mockResolvedValue({ count: 1 })
      mockRepository.create.mockResolvedValue({
        ...mockAcademicYear,
        isActive: true,
      })

      await useCase.execute(activeInput)

      expect(mockRepository.deactivateAll).toHaveBeenCalledWith()
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: '2025/2026',
        startYear: 2025,
        isActive: true,
      })
    })

    it('should NOT deactivate others when isActive is false/undefined', async () => {
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockAcademicYear)

      await useCase.execute(input)

      expect(mockRepository.deactivateAll).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException for an empty name', async () => {
      await expect(
        useCase.execute({ name: '  ', startYear: 2025 }),
      ).rejects.toThrow(BadRequestException)
      expect(mockRepository.findByName).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException for a startYear out of range', async () => {
      await expect(
        useCase.execute({ name: '2025/2026', startYear: 1800 }),
      ).rejects.toThrow(BadRequestException)
      expect(mockRepository.findByName).not.toHaveBeenCalled()
    })
  })
})

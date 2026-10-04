import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'
import { ActivateAcademicYearUseCase } from './activate-academic-year.use-case.js'

describe('ActivateAcademicYearUseCase', () => {
  let useCase: ActivateAcademicYearUseCase

  const mockRepository = {
    findById: jest.fn(),
    activateById: jest.fn(),
  }

  const inactiveYear = {
    id: 'ay-1',
    name: '2024/2025',
    isActive: false,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivateAcademicYearUseCase,
        { provide: IAcademicYearRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<ActivateAcademicYearUseCase>(
      ActivateAcademicYearUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute('ay-1')).rejects.toThrow(NotFoundException)
    })

    it('should return current if already active', async () => {
      const activeYear = { ...inactiveYear, isActive: true }
      mockRepository.findById.mockResolvedValue(activeYear)

      const result = await useCase.execute('ay-1')

      expect(result).toEqual(activeYear)
      expect(mockRepository.activateById).not.toHaveBeenCalled()
    })

    it('activates a year that has no semesters yet', async () => {
      const activatedYear = { ...inactiveYear, isActive: true }
      mockRepository.findById.mockResolvedValue(inactiveYear)
      mockRepository.activateById.mockResolvedValue(activatedYear)

      const result = await useCase.execute('ay-1')

      expect(mockRepository.activateById).toHaveBeenCalledWith('ay-1')
      expect(result.isActive).toBe(true)
    })

    it('should activate using atomic activateById when it has semesters', async () => {
      const activatedYear = { ...inactiveYear, isActive: true }
      mockRepository.findById.mockResolvedValue(inactiveYear)
      mockRepository.activateById.mockResolvedValue(activatedYear)

      const result = await useCase.execute('ay-1')

      expect(mockRepository.activateById).toHaveBeenCalledWith('ay-1')
      expect(result.isActive).toBe(true)
    })
  })
})

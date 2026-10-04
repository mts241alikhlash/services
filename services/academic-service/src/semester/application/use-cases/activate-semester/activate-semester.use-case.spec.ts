import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import { ActivateSemesterUseCase } from './activate-semester.use-case.js'

describe('ActivateSemesterUseCase', () => {
  let useCase: ActivateSemesterUseCase

  const mockSemesterRepository = {
    findById: jest.fn(),
    activateById: jest.fn(),
  }
  const mockAcademicYearRepository = {
    findById: jest.fn(),
  }

  const inactiveSemester = {
    id: 'sem-1',
    isActive: false,
    academicYear: { id: 'ay-1', name: '2025/2026' },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivateSemesterUseCase,
        { provide: ISemesterRepository, useValue: mockSemesterRepository },
        {
          provide: IAcademicYearRepository,
          useValue: mockAcademicYearRepository,
        },
      ],
    }).compile()

    useCase = module.get<ActivateSemesterUseCase>(ActivateSemesterUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should throw NotFoundException when not found', async () => {
      mockSemesterRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute('sem-1')).rejects.toThrow(NotFoundException)
    })

    it('should return current if already active', async () => {
      const active = { ...inactiveSemester, isActive: true }
      mockSemesterRepository.findById.mockResolvedValue(active)

      const result = await useCase.execute('sem-1')

      expect(result).toEqual(active)
      expect(mockSemesterRepository.activateById).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when the academic year is not active', async () => {
      mockSemesterRepository.findById.mockResolvedValue(inactiveSemester)
      mockAcademicYearRepository.findById.mockResolvedValue({
        id: 'ay-1',
        isActive: false,
      })

      await expect(useCase.execute('sem-1')).rejects.toThrow(
        BadRequestException,
      )
      expect(mockSemesterRepository.activateById).not.toHaveBeenCalled()
    })

    it('should activate when the academic year is active', async () => {
      mockSemesterRepository.findById.mockResolvedValue(inactiveSemester)
      mockAcademicYearRepository.findById.mockResolvedValue({
        id: 'ay-1',
        isActive: true,
      })
      mockSemesterRepository.activateById.mockResolvedValue({
        ...inactiveSemester,
        isActive: true,
      })

      const result = await useCase.execute('sem-1')

      expect(mockSemesterRepository.activateById).toHaveBeenCalledWith('sem-1')
      expect(result.isActive).toBe(true)
    })
  })
})

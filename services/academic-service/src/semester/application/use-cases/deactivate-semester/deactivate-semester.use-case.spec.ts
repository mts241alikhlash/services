import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import { DeactivateSemesterUseCase } from './deactivate-semester.use-case.js'

describe('DeactivateSemesterUseCase', () => {
  let useCase: DeactivateSemesterUseCase

  const mockRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeactivateSemesterUseCase,
        { provide: ISemesterRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<DeactivateSemesterUseCase>(DeactivateSemesterUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute('sem-1')).rejects.toThrow(NotFoundException)
    })

    it('should return current if already inactive', async () => {
      const inactive = { id: 'sem-1', isActive: false }
      mockRepository.findById.mockResolvedValue(inactive)

      const result = await useCase.execute('sem-1')

      expect(result).toEqual(inactive)
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should deactivate an active semester', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'sem-1', isActive: true })
      mockRepository.update.mockResolvedValue({ id: 'sem-1', isActive: false })

      const result = await useCase.execute('sem-1')

      expect(mockRepository.update).toHaveBeenCalledWith('sem-1', {
        isActive: false,
      })
      expect(result.isActive).toBe(false)
    })
  })
})

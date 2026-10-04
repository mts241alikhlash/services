import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import { DeleteSemesterUseCase } from './delete-semester.use-case.js'

describe('DeleteSemesterUseCase', () => {
  let useCase: DeleteSemesterUseCase

  const mockRepository = {
    findById: jest.fn(),
    findFirstDependent: jest.fn(),
    softDelete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSemesterUseCase,
        { provide: ISemesterRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<DeleteSemesterUseCase>(DeleteSemesterUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'sem-1'

    it('should soft-delete an inactive, dependent-free semester', async () => {
      mockRepository.findById.mockResolvedValue({ id, isActive: false })
      mockRepository.findFirstDependent.mockResolvedValue(null)

      await useCase.execute(id)

      expect(mockRepository.softDelete).toHaveBeenCalledWith(id)
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException)
      expect(mockRepository.softDelete).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when the semester is active', async () => {
      mockRepository.findById.mockResolvedValue({ id, isActive: true })

      await expect(useCase.execute(id)).rejects.toThrow(BadRequestException)
      expect(mockRepository.findFirstDependent).not.toHaveBeenCalled()
      expect(mockRepository.softDelete).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when the semester has dependents', async () => {
      mockRepository.findById.mockResolvedValue({ id, isActive: false })
      mockRepository.findFirstDependent.mockResolvedValue(
        'teaching assignments',
      )

      await expect(useCase.execute(id)).rejects.toThrow(BadRequestException)
      expect(mockRepository.softDelete).not.toHaveBeenCalled()
    })
  })
})

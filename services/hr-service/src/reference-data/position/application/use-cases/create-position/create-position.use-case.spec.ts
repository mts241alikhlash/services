import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IPositionRepository } from '../../../domain/repositories/position.repository.js'
import { CreatePositionUseCase } from './create-position.use-case.js'
import type { CreatePositionInput } from './create-position.input.js'

describe('CreatePositionUseCase', () => {
  let useCase: CreatePositionUseCase

  const mockRepo = {
    findByName: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePositionUseCase,
        { provide: IPositionRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<CreatePositionUseCase>(CreatePositionUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreatePositionInput = {
      name: 'Kepala Sekolah',
      categoryId: 'cat-1',
      isActive: true,
    }
    const mockPosition = {
      id: 'pos-1',
      name: 'Kepala Sekolah',
      categoryId: 'cat-1',
      isActive: true,
    }

    it('should create a position successfully', async () => {
      mockRepo.findByName.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue(mockPosition)

      const result = await useCase.execute(input)

      expect(mockRepo.findByName).toHaveBeenCalledWith(input.name)
      expect(mockRepo.create).toHaveBeenCalledWith({
        name: input.name,
        categoryId: input.categoryId,
        isActive: input.isActive,
      })
      expect(result).toEqual(mockPosition)
    })

    it('should throw ConflictException when position name already exists', async () => {
      mockRepo.findByName.mockResolvedValue({ id: 'pos-existing' })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})

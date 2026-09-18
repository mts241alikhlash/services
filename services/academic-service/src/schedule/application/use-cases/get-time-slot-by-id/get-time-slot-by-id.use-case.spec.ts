import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import { GetTimeSlotByIdUseCase } from './get-time-slot-by-id.use-case.js'

describe('GetTimeSlotByIdUseCase', () => {
  let useCase: GetTimeSlotByIdUseCase

  const mockRepo = {
    findById: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTimeSlotByIdUseCase,
        { provide: ITimeSlotRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<GetTimeSlotByIdUseCase>(GetTimeSlotByIdUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'ts-1'

    it('should return a time slot when found', async () => {
      const mockResult = { id, name: 'Jam ke-1' }
      mockRepo.findById.mockResolvedValue(mockResult)

      const result = await useCase.execute(id)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(result).toEqual(mockResult)
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException)
    })
  })
})

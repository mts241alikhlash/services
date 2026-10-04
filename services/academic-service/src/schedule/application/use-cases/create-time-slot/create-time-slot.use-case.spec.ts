import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import { CreateTimeSlotUseCase } from './create-time-slot.use-case.js'
import type { CreateTimeSlotInput } from './create-time-slot.input.js'

describe('CreateTimeSlotUseCase', () => {
  let useCase: CreateTimeSlotUseCase

  const mockRepo = {
    findByOrder: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTimeSlotUseCase,
        { provide: ITimeSlotRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<CreateTimeSlotUseCase>(CreateTimeSlotUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateTimeSlotInput = {
      name: 'Jam ke-1',
      startTime: '07:00',
      endTime: '07:30',
      order: 1,
      typeId: 'type-1',
    }

    it('should create a time slot when order is unique', async () => {
      const mockResult = { id: 'ts-1', ...input }
      mockRepo.findByOrder.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue(mockResult)

      const result = await useCase.execute(input)

      expect(mockRepo.findByOrder).toHaveBeenCalledWith(1)
      expect(mockRepo.create).toHaveBeenCalledWith(input)
      expect(result).toEqual(mockResult)
    })

    it('should throw ConflictException when order is taken', async () => {
      mockRepo.findByOrder.mockResolvedValue({ id: 'ts-existing' })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})

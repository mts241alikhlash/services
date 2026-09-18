import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import { DeleteTimeSlotUseCase } from './delete-time-slot.use-case.js'

describe('DeleteTimeSlotUseCase', () => {
  let useCase: DeleteTimeSlotUseCase

  const mockRepo = {
    findById: jest.fn(),
    countSchedulesUsing: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTimeSlotUseCase,
        { provide: ITimeSlotRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<DeleteTimeSlotUseCase>(DeleteTimeSlotUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'ts-1'

    it('should delete time slot when not in use', async () => {
      mockRepo.findById.mockResolvedValue({ id, name: 'Jam ke-1' })
      mockRepo.countSchedulesUsing.mockResolvedValue(0)
      mockRepo.remove.mockResolvedValue({ id })

      await useCase.execute(id)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(mockRepo.countSchedulesUsing).toHaveBeenCalledWith(id)
      expect(mockRepo.remove).toHaveBeenCalledWith(id)
    })

    it('should throw NotFoundException when slot does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null)
      mockRepo.countSchedulesUsing.mockResolvedValue(0)

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException)
      expect(mockRepo.remove).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when slot is in use', async () => {
      mockRepo.findById.mockResolvedValue({ id, name: 'Jam ke-1' })
      mockRepo.countSchedulesUsing.mockResolvedValue(3)

      await expect(useCase.execute(id)).rejects.toThrow(ConflictException)
      expect(mockRepo.remove).not.toHaveBeenCalled()
    })
  })
})

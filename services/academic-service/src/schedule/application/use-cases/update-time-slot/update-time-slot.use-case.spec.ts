import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import { UpdateTimeSlotUseCase } from './update-time-slot.use-case.js'
import type { UpdateTimeSlotInput } from './update-time-slot.input.js'

describe('UpdateTimeSlotUseCase', () => {
  let useCase: UpdateTimeSlotUseCase

  const mockRepo = {
    findById: jest.fn(),
    findByOrder: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTimeSlotUseCase,
        { provide: ITimeSlotRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<UpdateTimeSlotUseCase>(UpdateTimeSlotUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'ts-1'
    const current = {
      id,
      name: 'Jam ke-1',
      startTime: '07:00',
      endTime: '07:30',
      order: 1,
      typeId: 'type-1',
    }

    it('should update time slot when valid', async () => {
      const input: UpdateTimeSlotInput = { name: 'Jam ke-1 Revisi' }
      const updated = { ...current, name: 'Jam ke-1 Revisi' }
      mockRepo.findById.mockResolvedValue(current)
      mockRepo.update.mockResolvedValue(updated)

      const result = await useCase.execute(id, input)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(mockRepo.findByOrder).not.toHaveBeenCalled()
      expect(mockRepo.update).toHaveBeenCalledWith(id, {
        name: 'Jam ke-1 Revisi',
        startTime: undefined,
        endTime: undefined,
        order: undefined,
        typeId: undefined,
      })
      expect(result).toEqual(updated)
    })

    it('should check order uniqueness when order is provided', async () => {
      const input: UpdateTimeSlotInput = { order: 2 }
      mockRepo.findById.mockResolvedValue(current)
      mockRepo.findByOrder.mockResolvedValue(null)
      mockRepo.update.mockResolvedValue({ ...current, order: 2 })

      await useCase.execute(id, input)

      expect(mockRepo.findByOrder).toHaveBeenCalledWith(2, id)
    })

    it('should throw NotFoundException when slot does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when order is taken', async () => {
      mockRepo.findById.mockResolvedValue(current)
      mockRepo.findByOrder.mockResolvedValue({ id: 'ts-2', order: 2 })

      await expect(useCase.execute(id, { order: 2 })).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })
  })
})

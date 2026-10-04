import { Test, TestingModule } from '@nestjs/testing'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import { GetTimeSlotsUseCase } from './get-time-slots.use-case.js'

describe('GetTimeSlotsUseCase', () => {
  let useCase: GetTimeSlotsUseCase

  const mockRepo = {
    findAll: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTimeSlotsUseCase,
        { provide: ITimeSlotRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<GetTimeSlotsUseCase>(GetTimeSlotsUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should return all time slots', async () => {
      const mockResult = {
        data: [{ id: 'ts-1', name: 'Jam ke-1' }],
        total: 1,
        page: 1,
        limit: 10,
      }
      mockRepo.findAll.mockResolvedValue(mockResult)

      const result = await useCase.execute()

      expect(mockRepo.findAll).toHaveBeenCalled()
      expect(result).toEqual(mockResult)
    })
  })
})

import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'
import type { GetAcademicCalendarsInput } from './get-academic-calendars.input.js'
import { GetAcademicCalendarsUseCase } from './get-academic-calendars.use-case.js'

describe('GetAcademicCalendarsUseCase', () => {
  let useCase: GetAcademicCalendarsUseCase

  const mockRepo = { findAll: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAcademicCalendarsUseCase,
        { provide: IAcademicCalendarRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<GetAcademicCalendarsUseCase>(
      GetAcademicCalendarsUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should return paginated calendars', async () => {
      const input: GetAcademicCalendarsInput = {
        academicYearId: 'ay-uuid',
        page: 1,
        limit: 50,
      }
      const expected = {
        data: [{ id: 'cal-1' }],
        total: 1,
        page: 1,
        limit: 50,
      }
      mockRepo.findAll.mockResolvedValue(expected)

      const result = await useCase.execute(input)

      expect(mockRepo.findAll).toHaveBeenCalledWith(input)
      expect(result).toEqual(expected)
    })

    it('should pass typeId filter correctly', async () => {
      const input: GetAcademicCalendarsInput = {
        typeId: 'calendar-type-uuid',
      }
      mockRepo.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      })

      await useCase.execute(input)

      expect(mockRepo.findAll).toHaveBeenCalledWith(input)
    })
  })
})

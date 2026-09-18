import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'
import { BulkDeleteAcademicCalendarsUseCase } from './bulk-delete-academic-calendars.use-case.js'

describe('BulkDeleteAcademicCalendarsUseCase', () => {
  let useCase: BulkDeleteAcademicCalendarsUseCase

  const mockRepo = { softDeleteMany: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkDeleteAcademicCalendarsUseCase,
        { provide: IAcademicCalendarRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<BulkDeleteAcademicCalendarsUseCase>(
      BulkDeleteAcademicCalendarsUseCase,
    )
    jest.clearAllMocks()
  })

  it('soft-deletes every id it was given', async () => {
    mockRepo.softDeleteMany.mockResolvedValue(2)

    await expect(useCase.execute(['a', 'b'])).resolves.toEqual({ deleted: 2 })
    expect(mockRepo.softDeleteMany).toHaveBeenCalledWith(['a', 'b'])
  })

  it('counts a repeated id once', async () => {
    mockRepo.softDeleteMany.mockResolvedValue(1)

    await expect(useCase.execute(['a', 'a'])).resolves.toEqual({ deleted: 1 })
    expect(mockRepo.softDeleteMany).toHaveBeenCalledWith(['a'])
  })

  it('refuses the whole request when an id is unknown', async () => {
    mockRepo.softDeleteMany.mockResolvedValue(1)

    await expect(useCase.execute(['a', 'b'])).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('reports how many of the ids were missing', async () => {
    mockRepo.softDeleteMany.mockResolvedValue(1)

    await expect(useCase.execute(['a', 'b', 'c'])).rejects.toThrow(
      '2 of 3 academic calendar entries were not found',
    )
  })
})

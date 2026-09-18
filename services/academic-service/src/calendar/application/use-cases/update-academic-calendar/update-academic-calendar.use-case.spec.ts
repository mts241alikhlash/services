import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ISemesterRepository } from '../../../../semester/index.js'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'
import { AssertClassroomsExistService } from '../../services/assert-classrooms-exist.service.js'
import type { UpdateAcademicCalendarInput } from './update-academic-calendar.input.js'
import { UpdateAcademicCalendarUseCase } from './update-academic-calendar.use-case.js'

describe('UpdateAcademicCalendarUseCase', () => {
  let useCase: UpdateAcademicCalendarUseCase

  const mockRepo = {
    findById: jest.fn(),
    update: jest.fn(),
  }

  const mockSemesterRepository = {
    findById: jest.fn(),
  }

  const mockAssertClassroomsExist = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAcademicCalendarUseCase,
        { provide: IAcademicCalendarRepository, useValue: mockRepo },
        { provide: ISemesterRepository, useValue: mockSemesterRepository },
        {
          provide: AssertClassroomsExistService,
          useValue: mockAssertClassroomsExist,
        },
      ],
    }).compile()

    useCase = module.get<UpdateAcademicCalendarUseCase>(
      UpdateAcademicCalendarUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'cal-uuid'
    const input: UpdateAcademicCalendarInput = { title: 'Updated Title' }

    it('should update and return calendar entry', async () => {
      mockRepo.findById.mockResolvedValue({ id })
      mockRepo.update.mockResolvedValue({ id, ...input })

      const result = await useCase.execute(id, input)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(mockSemesterRepository.findById).not.toHaveBeenCalled()
      expect(mockRepo.update).toHaveBeenCalledWith(id, input)
      expect(result).toEqual({ id, ...input })
    })

    it('should validate semesterId when provided in update', async () => {
      const inputWithSemester: UpdateAcademicCalendarInput = {
        semesterId: 'sem-uuid',
      }
      mockRepo.findById.mockResolvedValue({ id })
      mockSemesterRepository.findById.mockResolvedValue({ id: 'sem-uuid' })
      mockRepo.update.mockResolvedValue({ id })

      await useCase.execute(id, inputWithSemester)

      expect(mockSemesterRepository.findById).toHaveBeenCalledWith('sem-uuid')
    })

    it('should throw NotFoundException when calendar not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when semester not found', async () => {
      const inputWithSemester: UpdateAcademicCalendarInput = {
        semesterId: 'sem-missing',
      }
      mockRepo.findById.mockResolvedValue({ id })
      mockSemesterRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, inputWithSemester)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })
  })
})

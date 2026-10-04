import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ISemesterRepository } from '../../../../semester/index.js'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'
import { AssertClassroomsExistService } from '../../services/assert-classrooms-exist.service.js'
import type { CreateAcademicCalendarInput } from './create-academic-calendar.input.js'
import { CreateAcademicCalendarUseCase } from './create-academic-calendar.use-case.js'

describe('CreateAcademicCalendarUseCase', () => {
  let useCase: CreateAcademicCalendarUseCase

  const mockRepo = {
    create: jest.fn(),
  }

  const mockAcademicYearRepository = {
    findById: jest.fn(),
  }

  const mockSemesterRepository = {
    findById: jest.fn(),
  }

  const mockAssertClassroomsExist = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAcademicCalendarUseCase,
        { provide: IAcademicCalendarRepository, useValue: mockRepo },
        {
          provide: IAcademicYearRepository,
          useValue: mockAcademicYearRepository,
        },
        { provide: ISemesterRepository, useValue: mockSemesterRepository },
        {
          provide: AssertClassroomsExistService,
          useValue: mockAssertClassroomsExist,
        },
      ],
    }).compile()

    useCase = module.get<CreateAcademicCalendarUseCase>(
      CreateAcademicCalendarUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateAcademicCalendarInput = {
      academicYearId: 'ay-uuid',
      title: 'Semester Ganjil 2024/2025',
      typeId: 'calendar-type-uuid',
      startDate: '2024-07-15',
      endDate: '2024-12-20',
    }

    it('should create calendar entry when academic year exists', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue({ id: 'ay-uuid' })
      mockRepo.create.mockResolvedValue({ id: 'cal-1', ...input })

      const result = await useCase.execute(input)

      expect(mockAcademicYearRepository.findById).toHaveBeenCalledWith(
        input.academicYearId,
      )
      expect(mockSemesterRepository.findById).not.toHaveBeenCalled()
      expect(mockRepo.create).toHaveBeenCalledWith({
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        startTime: null,
        endTime: null,
      })
      expect(result).toEqual({ id: 'cal-1', ...input })
    })

    it('should validate semesterId when provided', async () => {
      const inputWithSemester: CreateAcademicCalendarInput = {
        ...input,
        semesterId: 'sem-uuid',
      }
      mockAcademicYearRepository.findById.mockResolvedValue({ id: 'ay-uuid' })
      mockSemesterRepository.findById.mockResolvedValue({ id: 'sem-uuid' })
      mockRepo.create.mockResolvedValue({ id: 'cal-1', ...inputWithSemester })

      await useCase.execute(inputWithSemester)

      expect(mockSemesterRepository.findById).toHaveBeenCalledWith('sem-uuid')
    })

    it('should throw NotFoundException when academic year not found', async () => {
      mockAcademicYearRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when semester not found', async () => {
      const inputWithSemester: CreateAcademicCalendarInput = {
        ...input,
        semesterId: 'sem-missing',
      }
      mockAcademicYearRepository.findById.mockResolvedValue({ id: 'ay-uuid' })
      mockSemesterRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(inputWithSemester)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})

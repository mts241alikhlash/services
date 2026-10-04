import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IClassroomSupervisorRepository } from '../../../domain/repositories/classroom-supervisor.repository.js'
import type { CreateClassroomSupervisorInput } from './create-classroom-supervisor.input.js'
import { CreateClassroomSupervisorUseCase } from './create-classroom-supervisor.use-case.js'

describe('CreateClassroomSupervisorUseCase', () => {
  let useCase: CreateClassroomSupervisorUseCase

  const mockRepo: Partial<
    Record<keyof IClassroomSupervisorRepository, jest.Mock>
  > = {
    findEmployeeById: jest.fn(),
    findAssignment: jest.fn(),
    create: jest.fn(),
  }

  const mockEmployee = { id: 'employee-uuid-1' }

  const input: CreateClassroomSupervisorInput = {
    classroomId: 'class-uuid-1',
    employeeId: 'employee-uuid-1',
    semesterId: 'semester-uuid-1',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateClassroomSupervisorUseCase,
        { provide: IClassroomSupervisorRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<CreateClassroomSupervisorUseCase>(
      CreateClassroomSupervisorUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const mockSupervisor = { id: 'supervisor-uuid-1', ...input }

    it('should create class supervisor successfully', async () => {
      mockRepo.findEmployeeById!.mockResolvedValue(mockEmployee)
      mockRepo.findAssignment!.mockResolvedValue(null)
      mockRepo.create!.mockResolvedValue(mockSupervisor)

      const result = await useCase.execute(input)

      expect(mockRepo.findEmployeeById).toHaveBeenCalledWith(input.employeeId)
      expect(mockRepo.findAssignment).toHaveBeenCalledWith(
        input.classroomId,
        input.semesterId,
      )
      expect(mockRepo.create).toHaveBeenCalledWith({
        classroomId: input.classroomId,
        employeeId: input.employeeId,
        semesterId: input.semesterId,
      })
      expect(result).toEqual(mockSupervisor)
    })

    it('should throw NotFoundException when employee not found', async () => {
      mockRepo.findEmployeeById!.mockResolvedValue(null)
      mockRepo.findAssignment!.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when the classroom already has a supervisor for the semester', async () => {
      mockRepo.findEmployeeById!.mockResolvedValue(mockEmployee)
      mockRepo.findAssignment!.mockResolvedValue({ id: 'existing-uuid' })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})

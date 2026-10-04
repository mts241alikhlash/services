import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IClassroomSupervisorRepository } from '../../../domain/repositories/classroom-supervisor.repository.js'
import type { UpdateClassroomSupervisorInput } from './update-classroom-supervisor.input.js'
import { UpdateClassroomSupervisorUseCase } from './update-classroom-supervisor.use-case.js'

describe('UpdateClassroomSupervisorUseCase', () => {
  let useCase: UpdateClassroomSupervisorUseCase

  const mockRepo = {
    findById: jest.fn(),
    findClassroomById: jest.fn(),
    findEmployeeById: jest.fn(),
    findSemesterById: jest.fn(),
    findAssignment: jest.fn(),
    update: jest.fn(),
  }

  const mockExisting = {
    id: 'sup-uuid-1',
    classroomId: 'class-uuid-1',
    employeeId: 'employee-uuid-1',
    semesterId: 'semester-uuid-1',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateClassroomSupervisorUseCase,
        { provide: IClassroomSupervisorRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<UpdateClassroomSupervisorUseCase>(
      UpdateClassroomSupervisorUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'sup-uuid-1'

    it('should update employee without validating class or semester when unchanged', async () => {
      const input: UpdateClassroomSupervisorInput = {
        employeeId: 'employee-uuid-2',
      }
      const updated = { ...mockExisting, employeeId: 'employee-uuid-2' }

      mockRepo.findById.mockResolvedValue(mockExisting)
      mockRepo.findEmployeeById.mockResolvedValue({ id: 'employee-uuid-2' })
      mockRepo.findAssignment.mockResolvedValue(null)
      mockRepo.update.mockResolvedValue(updated)

      const result = await useCase.execute(id, input)

      expect(mockRepo.findClassroomById).not.toHaveBeenCalled()
      expect(mockRepo.findSemesterById).not.toHaveBeenCalled()
      expect(mockRepo.update).toHaveBeenCalledWith(id, input)
      expect(result).toEqual(updated)
    })

    it('should throw NotFoundException when supervisor not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, {})).rejects.toThrow(NotFoundException)
      expect(mockRepo.update).not.toHaveBeenCalled()
    })
    it('should throw ConflictException when class+semester pair already has a supervisor', async () => {
      const input: UpdateClassroomSupervisorInput = {
        semesterId: 'semester-uuid-2',
      }

      mockRepo.findById.mockResolvedValue(mockExisting)
      mockRepo.findSemesterById.mockResolvedValue({ id: 'semester-uuid-2' })
      mockRepo.findAssignment.mockResolvedValue({
        id: 'other-sup',
      })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })
  })
})

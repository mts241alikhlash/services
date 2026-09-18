import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ParentRelation } from '../../../../shared/domain/enums/parent-relation.enum.js'
import { CreateStudentParentInput } from './create-student-parent.input.js'
import { IStudentParentRepository } from '../../../domain/repositories/student-parent.repository.js'
import { CreateStudentParentUseCase } from './create-student-parent.use-case.js'

describe('CreateStudentParentUseCase', () => {
  let useCase: CreateStudentParentUseCase

  const mockRepo = {
    findStudent: jest.fn(),
    findParent: jest.fn(),
    findPair: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateStudentParentUseCase,
        { provide: IStudentParentRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<CreateStudentParentUseCase>(CreateStudentParentUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateStudentParentInput = {
      studentId: '550e8400-e29b-41d4-a716-446655440001',
      parentId: '550e8400-e29b-41d4-a716-446655440003',
      relation: ParentRelation.FATHER,
    }

    it('should create student-parent link successfully', async () => {
      const created = { id: 'link-1', ...input }
      mockRepo.findStudent.mockResolvedValue({ id: input.studentId })
      mockRepo.findParent.mockResolvedValue({ id: input.parentId })
      mockRepo.findPair.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue(created)

      const result = await useCase.execute(input)

      expect(mockRepo.findStudent).toHaveBeenCalledWith(input.studentId)
      expect(mockRepo.findParent).toHaveBeenCalledWith(input.parentId)
      expect(mockRepo.findPair).toHaveBeenCalledWith(
        input.studentId,
        input.parentId,
      )
      expect(mockRepo.create).toHaveBeenCalledWith(input)
      expect(result).toEqual(created)
    })

    it('should throw NotFoundException when student is not found', async () => {
      mockRepo.findStudent.mockResolvedValue(null)
      mockRepo.findParent.mockResolvedValue({ id: input.parentId })

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
      expect(mockRepo.findPair).not.toHaveBeenCalled()
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when parent is not found', async () => {
      mockRepo.findStudent.mockResolvedValue({ id: input.studentId })
      mockRepo.findParent.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
      expect(mockRepo.findPair).not.toHaveBeenCalled()
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when link already exists', async () => {
      mockRepo.findStudent.mockResolvedValue({ id: input.studentId })
      mockRepo.findParent.mockResolvedValue({ id: input.parentId })
      mockRepo.findPair.mockResolvedValue({ id: 'link-existing' })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})

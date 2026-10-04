import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CreateSubjectInput } from './create-subject.input.js'
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.js'
import { CreateSubjectUseCase } from './create-subject.use-case.js'

describe('CreateSubjectUseCase', () => {
  let useCase: CreateSubjectUseCase

  const mockRepo = {
    findByName: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSubjectUseCase,
        { provide: ISubjectRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<CreateSubjectUseCase>(CreateSubjectUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateSubjectInput = { name: 'Mathematics' }

    it('should create a subject successfully', async () => {
      const created = { id: 'sub-1', name: 'Mathematics' }
      mockRepo.findByName.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue(created)

      const result = await useCase.execute(input)

      expect(mockRepo.findByName).toHaveBeenCalledWith('Mathematics')
      expect(mockRepo.create).toHaveBeenCalledWith(input)
      expect(result).toEqual(created)
    })

    it('should not forward any employee field to the repository', async () => {
      const inputWithExtra: CreateSubjectInput = {
        name: 'Physics',
        code: 'FIS',
      }
      const created = { id: 'sub-2', name: 'Physics' }
      mockRepo.findByName.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue(created)

      await useCase.execute(inputWithExtra)

      expect(mockRepo.create).toHaveBeenCalledWith(inputWithExtra)
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ employeeIds: expect.anything() }),
      )
    })

    it('should throw ConflictException when subject name already exists', async () => {
      mockRepo.findByName.mockResolvedValue({
        id: 'sub-existing',
        name: 'Mathematics',
      })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})

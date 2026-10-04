import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UpdateSubjectInput } from './update-subject.input.js'
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.js'
import { UpdateSubjectUseCase } from './update-subject.use-case.js'

describe('UpdateSubjectUseCase', () => {
  let useCase: UpdateSubjectUseCase

  const mockRepo = {
    findById: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSubjectUseCase,
        { provide: ISubjectRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<UpdateSubjectUseCase>(UpdateSubjectUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'sub-1'
    const currentSubject = { id: 'sub-1', name: 'Mathematics' }

    it('should update a subject successfully (no name change)', async () => {
      const input: UpdateSubjectInput = { code: 'MTK' }
      const updated = { ...currentSubject, code: 'MTK' }
      mockRepo.findById.mockResolvedValue(currentSubject)
      mockRepo.update.mockResolvedValue(updated)

      const result = await useCase.execute(id, input)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(mockRepo.findByName).not.toHaveBeenCalled()
      expect(mockRepo.update).toHaveBeenCalledWith(id, input)
      expect(result).toEqual(updated)
    })

    it('should update name when name changes and is unique', async () => {
      const input: UpdateSubjectInput = { name: 'Advanced Mathematics' }
      const updated = { id: 'sub-1', name: 'Advanced Mathematics' }
      mockRepo.findById.mockResolvedValue(currentSubject)
      mockRepo.findByName.mockResolvedValue(null)
      mockRepo.update.mockResolvedValue(updated)

      const result = await useCase.execute(id, input)

      expect(mockRepo.findByName).toHaveBeenCalledWith('Advanced Mathematics')
      expect(mockRepo.update).toHaveBeenCalledWith(id, input)
      expect(result).toEqual(updated)
    })

    it('should NOT throw if findByName returns the same subject (same id)', async () => {
      const input: UpdateSubjectInput = { name: 'Mathematics' }
      mockRepo.findById.mockResolvedValue(currentSubject)
      mockRepo.findByName.mockResolvedValue({
        id: 'sub-1',
        name: 'Mathematics',
      })
      mockRepo.update.mockResolvedValue(currentSubject)

      await expect(useCase.execute(id, input)).resolves.toBeDefined()
      expect(mockRepo.update).toHaveBeenCalled()
    })

    it('should throw NotFoundException when subject is not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when new name is taken by another subject', async () => {
      const input: UpdateSubjectInput = { name: 'Physics' }
      mockRepo.findById.mockResolvedValue(currentSubject)
      mockRepo.findByName.mockResolvedValue({
        id: 'sub-other',
        name: 'Physics',
      })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should NOT call findByName when name is absent from input', async () => {
      const input: UpdateSubjectInput = { code: 'IPA' }
      mockRepo.findById.mockResolvedValue(currentSubject)
      mockRepo.update.mockResolvedValue(currentSubject)

      await useCase.execute(id, input)

      expect(mockRepo.findByName).not.toHaveBeenCalled()
    })
  })
})

import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UpdateStudentInput } from './update-student.input.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { UpdateStudentUseCase } from './update-student.use-case.js'

describe('UpdateStudentUseCase', () => {
  let useCase: UpdateStudentUseCase

  const mockRepo = {
    findById: jest.fn(),
    findByNis: jest.fn(),
    findByNisn: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateStudentUseCase,
        { provide: IStudentRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<UpdateStudentUseCase>(UpdateStudentUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'stu-1'
    const existing = { id: 'stu-1', nis: '2024001', nisn: '0012345678' }

    it('should update student successfully (no unique field changes)', async () => {
      const input: UpdateStudentInput = {}
      mockRepo.findById.mockResolvedValue(existing)
      mockRepo.update.mockResolvedValue({ ...existing })

      const result = await useCase.execute(id, input)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(mockRepo.update).toHaveBeenCalledWith(id, input)
      expect(result).toBeDefined()
    })

    it('should throw NotFoundException when student is not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, {})).rejects.toThrow(NotFoundException)
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when new NIS is taken by another student', async () => {
      const input: UpdateStudentInput = { nis: '2024999' }
      mockRepo.findById.mockResolvedValue(existing)
      mockRepo.findByNis.mockResolvedValue({ id: 'stu-other', nis: '2024999' })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should NOT throw when new NIS belongs to same student (self)', async () => {
      const input: UpdateStudentInput = { nis: '2024001' }
      mockRepo.findById.mockResolvedValue(existing)
      mockRepo.findByNis.mockResolvedValue({ id: 'stu-1', nis: '2024001' })
      mockRepo.update.mockResolvedValue(existing)

      await expect(useCase.execute(id, input)).resolves.toBeDefined()
    })

    it('should throw ConflictException when new NISN is taken by another student', async () => {
      const input: UpdateStudentInput = { nisn: '9999999999' }
      mockRepo.findById.mockResolvedValue(existing)
      mockRepo.findByNisn.mockResolvedValue({
        id: 'stu-other',
        nisn: '9999999999',
      })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should NOT call findByNis when nis is absent from dto', async () => {
      const input: UpdateStudentInput = {}
      mockRepo.findById.mockResolvedValue(existing)
      mockRepo.update.mockResolvedValue(existing)

      await useCase.execute(id, input)

      expect(mockRepo.findByNis).not.toHaveBeenCalled()
      expect(mockRepo.findByNisn).not.toHaveBeenCalled()
    })
  })
})

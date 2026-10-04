import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IClassroomRepository } from '../../../domain/repositories/classroom.repository.js'
import type { CreateClassroomInput } from './create-classroom.input.js'
import { CreateClassroomUseCase } from './create-classroom.use-case.js'

describe('CreateClassroomUseCase', () => {
  let useCase: CreateClassroomUseCase

  const mockRepository = {
    findDuplicate: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateClassroomUseCase,
        { provide: IClassroomRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<CreateClassroomUseCase>(CreateClassroomUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateClassroomInput = {
      academicYearId: 'ay-1',
      gradeId: 'lvl-7',
      code: 'VII-A',
      name: 'Awesome',
      capacity: 30,
    }

    it('should create a classroom successfully', async () => {
      const created = { id: 'cls-1', ...input }
      mockRepository.findDuplicate.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(created)

      const result = await useCase.execute(input)

      expect(mockRepository.findDuplicate).toHaveBeenCalledWith(
        input.code,
        input.academicYearId,
      )
      expect(mockRepository.create).toHaveBeenCalled()
      expect(result).toEqual({
        ...created,
        displayName: `${input.code} (${input.name})`,
      })
    })

    it('should create a classroom successfully without name', async () => {
      const inputWithoutName = { ...input }
      delete inputWithoutName.name
      const created = { id: 'cls-1', ...inputWithoutName, name: null }
      mockRepository.findDuplicate.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(created)

      const result = await useCase.execute(inputWithoutName)

      expect(mockRepository.create).toHaveBeenCalledWith({
        academicYearId: input.academicYearId,
        gradeId: input.gradeId,
        code: input.code,
        name: undefined,
        capacity: input.capacity,
        isActive: input.isActive,
      })
      expect(result.displayName).toEqual(input.code)
    })

    it('should throw ConflictException when duplicate exists', async () => {
      mockRepository.findDuplicate.mockResolvedValue({ id: 'existing' })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })
  })
})

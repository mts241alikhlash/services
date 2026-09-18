import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { CreateStudentInput } from './create-student.input.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { CreateStudentUseCase } from './create-student.use-case.js'
import { EnsureStudentEnrollmentUseCase } from '../../../../enrollment/application/use-cases/ensure-student-enrollment/ensure-student-enrollment.use-case.js'

describe('CreateStudentUseCase', () => {
  let useCase: CreateStudentUseCase

  const mockStudentRepository = {
    findByNis: jest.fn(),
    findByNisn: jest.fn(),
    create: jest.fn(),
  }

  const mockEnsureStudentEnrollment = {
    execute: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateStudentUseCase,
        { provide: IStudentRepository, useValue: mockStudentRepository },
        {
          provide: EnsureStudentEnrollmentUseCase,
          useValue: mockEnsureStudentEnrollment,
        },
      ],
    }).compile()

    useCase = module.get<CreateStudentUseCase>(CreateStudentUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateStudentInput = {
      identifier: 'siswa001',
      password: 'P@ssw0rd!',
      name: 'Ahmad Fauzi',
      nik: '3578010101080001',
      gender: UserGender.MALE,
      birthPlace: 'Malang',
      birthDate: '2008-01-01',
      gradeId: '550e8400-e29b-41d4-a716-446655440099',
      classroomId: '550e8400-e29b-41d4-a716-446655440004',
      nis: '2024001',
      nisn: '0012345678',
    }

    const mockStudent = {
      id: 'stu-1',
      userId: 'usr-1',
      nis: '2024001',
      nisn: '0012345678',
      status: 'ACTIVE',
      gradeId: '550e8400-e29b-41d4-a716-446655440099',
    }

    it('should create a student and ensure classroom enrollment', async () => {
      mockStudentRepository.findByNis.mockResolvedValue(null)
      mockStudentRepository.findByNisn.mockResolvedValue(null)
      mockStudentRepository.create.mockResolvedValue({ student: mockStudent })

      const result = await useCase.execute(input)

      expect(mockStudentRepository.findByNis).toHaveBeenCalledWith(input.nis)
      expect(mockStudentRepository.findByNisn).toHaveBeenCalledWith(input.nisn)
      expect(mockStudentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: input.identifier,
          name: input.name,
          nik: input.nik,
          gender: input.gender,
          birthPlace: input.birthPlace,
          birthDate: new Date(input.birthDate),
          gradeId: input.gradeId,
          classroomId: input.classroomId,
          nis: input.nis,
          nisn: input.nisn,
        }),
        expect.any(String),
      )
      expect(mockEnsureStudentEnrollment.execute).toHaveBeenCalledWith(
        'stu-1',
        input.classroomId,
      )
      expect(result).toEqual({
        id: 'stu-1',
        userId: 'usr-1',
        nis: '2024001',
        nisn: '0012345678',
        status: 'ACTIVE',
        gradeId: '550e8400-e29b-41d4-a716-446655440099',
      })
    })

    it('should create a student without ensuring enrollment (no classroomId)', async () => {
      const ppdbInput: CreateStudentInput = { ...input, classroomId: undefined }
      mockStudentRepository.findByNis.mockResolvedValue(null)
      mockStudentRepository.findByNisn.mockResolvedValue(null)
      mockStudentRepository.create.mockResolvedValue({ student: mockStudent })

      const result = await useCase.execute(ppdbInput)

      expect(mockEnsureStudentEnrollment.execute).not.toHaveBeenCalled()
      expect(result).toEqual({
        id: 'stu-1',
        userId: 'usr-1',
        nis: '2024001',
        nisn: '0012345678',
        status: 'ACTIVE',
        gradeId: '550e8400-e29b-41d4-a716-446655440099',
      })
    })

    it('should throw ConflictException when NIS is already registered', async () => {
      mockStudentRepository.findByNis.mockResolvedValue({
        id: 'stu-existing',
        nis: '2024001',
      })
      mockStudentRepository.findByNisn.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockStudentRepository.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when NISN is already registered', async () => {
      mockStudentRepository.findByNis.mockResolvedValue(null)
      mockStudentRepository.findByNisn.mockResolvedValue({
        id: 'stu-existing',
        nisn: '0012345678',
      })

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockStudentRepository.create).not.toHaveBeenCalled()
    })
  })
})

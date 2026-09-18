import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { CreateEmployeeInput } from './create-employee.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { CreateEmployeeUseCase } from './create-employee.use-case.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'

jest.mock('../../../../shared/utils/hash.helper.js', () => ({
  hashPassword: jest.fn(),
}))

describe('CreateEmployeeUseCase', () => {
  let useCase: CreateEmployeeUseCase

  const mockRepository = {
    findUserByIdentifier: jest.fn(),
    findProfileByNik: jest.fn(),
    findByNip: jest.fn(),
    findByNuptk: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEmployeeUseCase,
        { provide: IEmployeeRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<CreateEmployeeUseCase>(CreateEmployeeUseCase)
    jest.clearAllMocks()
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateEmployeeInput = {
      identifier: 'guru001',
      password: 'P@ssw0rd!',
      name: 'Budi Santoso',
      nik: '3578010101700001',
      gender: UserGender.MALE,
      birthPlace: 'Surabaya',
      birthDate: '1980-06-15',
      employmentTypeId: 'emp-type-uuid',
    }

    const mockEmployee = {
      id: 'emp-1',
      user: { id: 'u-1', identifier: 'guru001' },
      profile: { id: 'p-1', name: 'Budi Santoso', nik: '3578010101700001' },
    }

    it('should create an employee successfully', async () => {
      mockRepository.findUserByIdentifier.mockResolvedValue(null)
      mockRepository.findProfileByNik.mockResolvedValue(null)
      mockRepository.findByNip.mockResolvedValue(null)
      mockRepository.findByNuptk.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockEmployee)

      const result = await useCase.execute(input)

      expect(mockRepository.findUserByIdentifier).toHaveBeenCalledWith(
        'guru001',
      )
      expect(mockRepository.findProfileByNik).toHaveBeenCalledWith(
        '3578010101700001',
      )

      expect(mockRepository.findByNip).not.toHaveBeenCalled()
      expect(mockRepository.findByNuptk).not.toHaveBeenCalled()
      expect(mockRepository.create).toHaveBeenCalledWith(
        { ...input, birthDate: new Date(input.birthDate) },
        'hashed-password',
      )
      expect(result).toEqual(mockEmployee)
    })

    it('should throw ConflictException when identifier is already taken', async () => {
      mockRepository.findUserByIdentifier.mockResolvedValue({
        id: 'existing-u',
      })
      mockRepository.findProfileByNik.mockResolvedValue(null)
      mockRepository.findByNip.mockResolvedValue(null)
      mockRepository.findByNuptk.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when NIK is already registered', async () => {
      mockRepository.findUserByIdentifier.mockResolvedValue(null)
      mockRepository.findProfileByNik.mockResolvedValue({ id: 'existing-p' })
      mockRepository.findByNip.mockResolvedValue(null)
      mockRepository.findByNuptk.mockResolvedValue(null)

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when NIP is already registered', async () => {
      const inputWithNip: CreateEmployeeInput = {
        ...input,
        nip: '198006152005011001',
      }

      mockRepository.findUserByIdentifier.mockResolvedValue(null)
      mockRepository.findProfileByNik.mockResolvedValue(null)
      mockRepository.findByNip.mockResolvedValue({ id: 'existing-emp' })
      mockRepository.findByNuptk.mockResolvedValue(null)

      await expect(useCase.execute(inputWithNip)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when NUPTK is already registered', async () => {
      const inputWithNuptk: CreateEmployeeInput = {
        ...input,
        nuptk: '1234567890123456',
      }

      mockRepository.findUserByIdentifier.mockResolvedValue(null)
      mockRepository.findProfileByNik.mockResolvedValue(null)
      mockRepository.findByNip.mockResolvedValue(null)
      mockRepository.findByNuptk.mockResolvedValue({ id: 'existing-emp' })

      await expect(useCase.execute(inputWithNuptk)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should NOT check NIP when nip is not provided', async () => {
      mockRepository.findUserByIdentifier.mockResolvedValue(null)
      mockRepository.findProfileByNik.mockResolvedValue(null)
      mockRepository.findByNip.mockResolvedValue(null)
      mockRepository.findByNuptk.mockResolvedValue(null)
      mockRepository.create.mockResolvedValue(mockEmployee)

      await useCase.execute(input)

      expect(mockRepository.findByNip).not.toHaveBeenCalled()
    })
  })
})

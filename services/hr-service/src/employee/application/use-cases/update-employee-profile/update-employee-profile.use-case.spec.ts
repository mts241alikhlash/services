import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UpdateEmployeeProfileInput } from './update-employee-profile.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { UpdateEmployeeProfileUseCase } from './update-employee-profile.use-case.js'

describe('UpdateEmployeeProfileUseCase', () => {
  let useCase: UpdateEmployeeProfileUseCase

  const mockRepository = {
    findById: jest.fn(),
    findProfileByUserId: jest.fn(),
    updateProfile: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEmployeeProfileUseCase,
        { provide: IEmployeeRepository, useValue: mockRepository },
      ],
    }).compile()

    useCase = module.get<UpdateEmployeeProfileUseCase>(
      UpdateEmployeeProfileUseCase,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'emp-1'
    const currentEmployee = { id: 'emp-1', user: { id: 'u-1' } }

    it('should update employee profile successfully', async () => {
      const input: UpdateEmployeeProfileInput = { name: 'Budi Revised' }
      const updatedProfile = { id: 'p-1', name: 'Budi Revised' }

      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.findProfileByUserId.mockResolvedValue(null)
      mockRepository.updateProfile.mockResolvedValue(updatedProfile)

      const result = await useCase.execute(id, input)

      expect(mockRepository.findById).toHaveBeenCalledWith(id)
      expect(mockRepository.updateProfile).toHaveBeenCalledWith('u-1', input)
      expect(result).toEqual(updatedProfile)
    })

    it('should throw NotFoundException when employee is not found', async () => {
      const input: UpdateEmployeeProfileInput = { name: 'Budi Revised' }
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepository.updateProfile).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when new NIK is already registered', async () => {
      const input: UpdateEmployeeProfileInput = { nik: '9999999999999999' }
      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.findProfileByUserId.mockResolvedValue({
        id: 'dup-profile',
      })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepository.updateProfile).not.toHaveBeenCalled()
    })

    it('should NOT check NIK uniqueness when nik is not in input', async () => {
      const input: UpdateEmployeeProfileInput = { name: 'Budi Revised' }
      mockRepository.findById.mockResolvedValue(currentEmployee)
      mockRepository.updateProfile.mockResolvedValue({ id: 'p-1' })

      await useCase.execute(id, input)

      expect(mockRepository.findProfileByUserId).not.toHaveBeenCalled()
    })
  })
})

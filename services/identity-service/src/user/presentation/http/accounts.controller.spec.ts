import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { UserGender } from '../../../shared/domain/enums/user-gender.enum.js'
import { ProvisionAccountDto } from './dto/request/provision-account.dto.js'
import { ProvisionAccountUseCase } from '../../application/use-cases/provision-account/provision-account.use-case.js'
import { DeleteUserUseCase } from '../../application/use-cases/delete-user/delete-user.use-case.js'
import { SetAccountActiveUseCase } from '../../application/use-cases/set-account-active/set-account-active.use-case.js'
import { UpdateAccountProfileUseCase } from '../../application/use-cases/update-account-profile/update-account-profile.use-case.js'
import { LookupAccountUseCase } from '../../application/use-cases/lookup-account/lookup-account.use-case.js'
import { AssignAccountRoleUseCase } from '../../application/use-cases/assign-account-role/assign-account-role.use-case.js'
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id/get-user-by-id.use-case.js'
import { AccountsController } from './accounts.controller.js'

describe('AccountsController', () => {
  let controller: AccountsController

  const mockProvisionAccountUseCase = { execute: jest.fn() }
  const mockDeleteUserUseCase = { execute: jest.fn() }
  const mockSetAccountActiveUseCase = { execute: jest.fn() }
  const mockUpdateAccountProfileUseCase = { execute: jest.fn() }
  const mockLookupAccountUseCase = { execute: jest.fn() }
  const mockAssignAccountRoleUseCase = { execute: jest.fn() }
  const mockGetUserByIdUseCase = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: ProvisionAccountUseCase,
          useValue: mockProvisionAccountUseCase,
        },
        { provide: DeleteUserUseCase, useValue: mockDeleteUserUseCase },
        {
          provide: SetAccountActiveUseCase,
          useValue: mockSetAccountActiveUseCase,
        },
        {
          provide: UpdateAccountProfileUseCase,
          useValue: mockUpdateAccountProfileUseCase,
        },
        { provide: LookupAccountUseCase, useValue: mockLookupAccountUseCase },
        {
          provide: AssignAccountRoleUseCase,
          useValue: mockAssignAccountRoleUseCase,
        },
        { provide: GetUserByIdUseCase, useValue: mockGetUserByIdUseCase },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile()

    controller = module.get<AccountsController>(AccountsController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('provision', () => {
    it('delegates to ProvisionAccountUseCase with the dto', async () => {
      const dto: ProvisionAccountDto = {
        identifier: 'guru001',
        passwordHash: 'hashed',
        roleCode: 'TEACHER',
        profile: {
          name: 'Budi Santoso',
          nik: '3578010101700001',
          gender: UserGender.MALE,
          birthPlace: 'Surabaya',
          birthDate: '1980-06-15',
        },
      }
      mockProvisionAccountUseCase.execute.mockResolvedValue({ id: 'u-1' })

      const result = await controller.provision(dto)

      expect(mockProvisionAccountUseCase.execute).toHaveBeenCalledWith(dto)
      expect(result).toEqual({ id: 'u-1' })
    })
  })

  describe('deprovision', () => {
    it('delegates to DeleteUserUseCase with the userId', async () => {
      await controller.deprovision('u-1')

      expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith('u-1')
    })
  })

  describe('setActive', () => {
    it('delegates to SetAccountActiveUseCase with the userId and flag', async () => {
      mockSetAccountActiveUseCase.execute.mockResolvedValue({ id: 'u-1' })

      const result = await controller.setActive('u-1', { isActive: false })

      expect(mockSetAccountActiveUseCase.execute).toHaveBeenCalledWith(
        'u-1',
        false,
      )
      expect(result).toEqual({ id: 'u-1' })
    })
  })

  describe('updateProfile', () => {
    it('delegates to UpdateAccountProfileUseCase with the userId and dto', async () => {
      const dto = { name: 'Budi Santoso Jr.' }
      mockUpdateAccountProfileUseCase.execute.mockResolvedValue({ id: 'p-1' })

      const result = await controller.updateProfile('u-1', dto)

      expect(mockUpdateAccountProfileUseCase.execute).toHaveBeenCalledWith(
        'u-1',
        dto,
      )
      expect(result).toEqual({ id: 'p-1' })
    })
  })

  describe('lookup', () => {
    it('delegates to LookupAccountUseCase with the query params', async () => {
      mockLookupAccountUseCase.execute.mockResolvedValue({
        identifierTaken: true,
        nikOwnerId: null,
      })

      const result = await controller.lookup('guru001', undefined)

      expect(mockLookupAccountUseCase.execute).toHaveBeenCalledWith(
        'guru001',
        undefined,
      )
      expect(result).toEqual({ identifierTaken: true, nikOwnerId: null })
    })
  })

  describe('findOne', () => {
    it('delegates to GetUserByIdUseCase with the userId', async () => {
      const user = {
        id: 'u-1',
        identifier: 'guru001',
        lastLoginAt: new Date('2024-01-01T00:00:00.000Z'),
      }
      mockGetUserByIdUseCase.execute.mockResolvedValue(user)

      const result = await controller.findOne('u-1')

      expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith('u-1')
      expect(result).toEqual({
        id: 'u-1',
        identifier: 'guru001',
        lastLoginAt: user.lastLoginAt,
      })
    })
  })

  describe('assignRole', () => {
    it('delegates to AssignAccountRoleUseCase with the userId and role code', async () => {
      mockAssignAccountRoleUseCase.execute.mockResolvedValue(undefined)

      await controller.assignRole('u-1', { roleCode: 'STUDENT' })

      expect(mockAssignAccountRoleUseCase.execute).toHaveBeenCalledWith(
        'u-1',
        'STUDENT',
      )
    })
  })
})

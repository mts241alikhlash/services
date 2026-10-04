import { ConflictException } from '@nestjs/common'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { ProvisionAccountInput } from './provision-account.input.js'
import { ProvisionAccountUseCase } from './provision-account.use-case.js'

describe('ProvisionAccountUseCase', () => {
  const mockUserRepository = {
    existsByIdentifier: jest.fn(),
    provisionAccount: jest.fn(),
  }

  const useCase = new ProvisionAccountUseCase(mockUserRepository as never)

  const input: ProvisionAccountInput = {
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('provisions the account and converts the birth date', async () => {
    mockUserRepository.existsByIdentifier.mockResolvedValue(false)
    mockUserRepository.provisionAccount.mockResolvedValue({ id: 'u-1' })

    const result = await useCase.execute(input)

    expect(mockUserRepository.existsByIdentifier).toHaveBeenCalledWith(
      'guru001',
    )
    expect(mockUserRepository.provisionAccount).toHaveBeenCalledWith({
      identifier: 'guru001',
      passwordHash: 'hashed',
      roleCode: 'TEACHER',
      profile: {
        name: 'Budi Santoso',
        nik: '3578010101700001',
        gender: UserGender.MALE,
        birthPlace: 'Surabaya',
        birthDate: new Date('1980-06-15'),
      },
    })
    expect(result).toEqual({ id: 'u-1' })
  })

  it('provisions without a profile when none is given', async () => {
    mockUserRepository.existsByIdentifier.mockResolvedValue(false)
    mockUserRepository.provisionAccount.mockResolvedValue({ id: 'u-2' })

    await useCase.execute({ ...input, profile: undefined })

    expect(mockUserRepository.provisionAccount).toHaveBeenCalledWith({
      identifier: 'guru001',
      passwordHash: 'hashed',
      roleCode: 'TEACHER',
    })
  })

  it('refuses a taken identifier before provisioning', async () => {
    mockUserRepository.existsByIdentifier.mockResolvedValue(true)

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
    expect(mockUserRepository.provisionAccount).not.toHaveBeenCalled()
  })
})

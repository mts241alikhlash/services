import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { ProvisionAccountRepositoryInput } from '../../../domain/repositories/user.repository.js'
import { PrismaUserRepository } from './prisma-user.repository.js'

describe('PrismaUserRepository.provisionAccount', () => {
  const input: ProvisionAccountRepositoryInput = {
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
  }

  function makeTx(role: { id: string } | null) {
    return {
      user: { create: jest.fn().mockResolvedValue({ id: 'u-1' }) },
      role: { findUnique: jest.fn().mockResolvedValue(role) },
      userRole: { create: jest.fn().mockResolvedValue({}) },
    }
  }

  function repositoryWith(tx: ReturnType<typeof makeTx>) {
    const prisma = {
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)),
    }
    return new PrismaUserRepository(prisma as never)
  }

  it('creates the user with nested profile and assigns the role', async () => {
    const tx = makeTx({ id: 'r-1' })
    const repository = repositoryWith(tx)

    const account = await repository.provisionAccount(input)

    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        identifier: 'guru001',
        passwordHash: 'hashed',
        profile: { create: input.profile },
      },
    })
    expect(tx.role.findUnique).toHaveBeenCalledWith({
      where: { code: 'TEACHER' },
    })
    expect(tx.userRole.create).toHaveBeenCalledWith({
      data: { userId: 'u-1', roleId: 'r-1' },
    })
    expect(account).toEqual({ id: 'u-1' })
  })

  it('refuses rather than creating an account with no role', async () => {
    const tx = makeTx(null)
    const repository = repositoryWith(tx)

    await expect(repository.provisionAccount(input)).rejects.toThrow(
      /TEACHER role does not exist/,
    )
    expect(tx.userRole.create).not.toHaveBeenCalled()
  })

  it('skips the role lookup entirely when no role code is given', async () => {
    const tx = makeTx({ id: 'r-1' })
    const repository = repositoryWith(tx)

    await repository.provisionAccount({ ...input, roleCode: undefined })

    expect(tx.role.findUnique).not.toHaveBeenCalled()
    expect(tx.userRole.create).not.toHaveBeenCalled()
  })

  it('creates the account without a profile when none is given', async () => {
    const tx = makeTx({ id: 'r-1' })
    const repository = repositoryWith(tx)

    await repository.provisionAccount({
      identifier: 'applicant01',
      passwordHash: 'hashed',
      roleCode: 'APPLICANT',
    })

    expect(tx.user.create).toHaveBeenCalledWith({
      data: { identifier: 'applicant01', passwordHash: 'hashed' },
    })
  })
})

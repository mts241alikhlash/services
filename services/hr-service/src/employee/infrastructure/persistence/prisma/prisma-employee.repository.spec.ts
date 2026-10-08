import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IAccountProvisioningPort } from '../../../../platform/user/index.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { PrismaEmployeeRepository } from './prisma-employee.repository.js'

describe('PrismaEmployeeRepository.create', () => {
  const write = jest.fn()
  const tx = { employee: { create: write } }
  const prisma = {
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  }
  const provisioning = { provision: jest.fn(), deprovision: jest.fn() }
  const profiles = { findByUserIds: jest.fn() }
  const repository = new PrismaEmployeeRepository(
    prisma as unknown as PrismaService,
    provisioning as unknown as IAccountProvisioningPort,
    profiles,
    {} as IAcademicLookupPort,
  )
  const input = {
    name: 'Budi',
    nik: '1234567890123456',
    gender: UserGender.MALE,
    birthPlace: 'Bandung',
    birthDate: new Date('1990-01-01'),
    employmentTypeId: 'et-1',
  }

  beforeEach(() => {
    jest.resetAllMocks()
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => unknown) => fn(tx),
    )
    provisioning.provision.mockResolvedValue({ id: 'u-1' })
    provisioning.deprovision.mockResolvedValue(undefined)
    write.mockResolvedValue({ id: 'emp-1', userId: 'u-1' })
    profiles.findByUserIds.mockResolvedValue([
      {
        userId: 'u-1',
        identifier: '1234567890123456',
        isActive: true,
        name: 'Budi',
        nik: input.nik,
        gender: UserGender.MALE,
      },
    ])
  })

  it('provisions an account before writing and attaches its profile after', async () => {
    const employee = await repository.create(input, 'hashed')
    expect(employee).toMatchObject({
      id: 'emp-1',
      user: { id: 'u-1', profile: { name: 'Budi' } },
    })
    expect(provisioning.provision.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.$transaction.mock.invocationCallOrder[0],
    )
    expect(profiles.findByUserIds.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.$transaction.mock.invocationCallOrder[0],
    )
    expect(profiles.findByUserIds).toHaveBeenCalledWith(['u-1'])
    expect(provisioning.deprovision).not.toHaveBeenCalled()
  })

  it('deprovisions the account when the employee write fails', async () => {
    write.mockRejectedValue(new Error('employee write failed'))
    await expect(repository.create(input, 'hashed')).rejects.toThrow(
      'employee write failed',
    )
    expect(provisioning.deprovision).toHaveBeenCalledTimes(1)
    expect(provisioning.deprovision).toHaveBeenCalledWith('u-1')
  })

  it('deprovisions the account when attaching its profile fails', async () => {
    profiles.findByUserIds.mockRejectedValue(new Error('profile lookup failed'))
    await expect(repository.create(input, 'hashed')).rejects.toThrow(
      'profile lookup failed',
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(provisioning.deprovision).toHaveBeenCalledWith('u-1')
  })

  it('refuses an account whose profile lookup returns no reference', async () => {
    profiles.findByUserIds.mockResolvedValue([])
    await expect(repository.create(input, 'hashed')).rejects.toThrow(
      'Account profile unavailable',
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(provisioning.deprovision).toHaveBeenCalledWith('u-1')
  })

  it('never writes or deprovisions an account that could not be provisioned', async () => {
    provisioning.provision.mockRejectedValue(new Error('identity rejected'))
    await expect(repository.create(input, 'hashed')).rejects.toThrow(
      'identity rejected',
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(provisioning.deprovision).not.toHaveBeenCalled()
  })

  it('reports a failed compensation instead of claiming a successful creation', async () => {
    write.mockRejectedValue(new Error('employee write failed'))
    provisioning.deprovision.mockRejectedValue(
      new Error('account cleanup failed'),
    )
    await expect(repository.create(input, 'hashed')).rejects.toMatchObject({
      errors: [
        expect.objectContaining({ message: 'employee write failed' }),
        expect.objectContaining({ message: 'account cleanup failed' }),
      ],
    })
    expect(provisioning.deprovision).toHaveBeenCalledWith('u-1')
  })
})

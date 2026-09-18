import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IProfileAddressRepository } from '../../domain/repositories/profile-address.repository.js'
import { ProfileAddressService } from './profile-address.service.js'

describe('ProfileAddressService', () => {
  const address = {
    id: 'addr-1',
    street: 'Jl. Veteran No. 1',
    rt: '001',
    rw: '002',
    village: 'Penanggungan',
    district: 'Klojen',
    city: 'Kota Malang',
    province: 'Jawa Timur',
    country: 'Indonesia',
    postalCode: '65113',
    isPrimary: false,
    latitude: null,
    longitude: null,
  }

  const repository = {
    findProfileIdByUserId: jest.fn(),
    findAllByProfileId: jest.fn(),
    findByIdForProfile: jest.fn(),
    findByUserIds: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    clearPrimary: jest.fn(),
  }

  let service: ProfileAddressService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileAddressService,
        { provide: IProfileAddressRepository, useValue: repository },
      ],
    }).compile()

    service = moduleRef.get(ProfileAddressService)
    jest.clearAllMocks()
    repository.findProfileIdByUserId.mockResolvedValue('profile-1')
  })

  it('refuses every operation when the account has no profile', async () => {
    repository.findProfileIdByUserId.mockResolvedValue(null)

    await expect(service.list('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('lists the addresses of the profile behind the user', async () => {
    repository.findAllByProfileId.mockResolvedValue([address])

    await expect(service.list('user-1')).resolves.toEqual([address])
    expect(repository.findAllByProfileId).toHaveBeenCalledWith('profile-1')
  })

  it('clears the old primary before adding a new primary', async () => {
    repository.create.mockResolvedValue({ ...address, isPrimary: true })

    await service.add('user-1', { ...address, isPrimary: true })

    expect(repository.clearPrimary).toHaveBeenCalledWith('profile-1')
  })

  it('leaves the primary alone when the new address is not primary', async () => {
    repository.create.mockResolvedValue(address)

    await service.add('user-1', address)

    expect(repository.clearPrimary).not.toHaveBeenCalled()
  })

  it('refuses to update an address that belongs to someone else', async () => {
    repository.findByIdForProfile.mockResolvedValue(null)

    await expect(
      service.update('user-1', 'addr-9', { city: 'Bandung' }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('exempts the address being promoted when it clears the primary', async () => {
    repository.findByIdForProfile.mockResolvedValue(address)
    repository.update.mockResolvedValue({ ...address, isPrimary: true })

    await service.update('user-1', 'addr-1', { isPrimary: true })

    expect(repository.clearPrimary).toHaveBeenCalledWith('profile-1', 'addr-1')
  })

  it('refuses to remove an address that belongs to someone else', async () => {
    repository.findByIdForProfile.mockResolvedValue(null)

    await expect(service.remove('user-1', 'addr-9')).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(repository.softDelete).not.toHaveBeenCalled()
  })

  it('soft-deletes an address the person owns', async () => {
    repository.findByIdForProfile.mockResolvedValue(address)

    await service.remove('user-1', 'addr-1')

    expect(repository.softDelete).toHaveBeenCalledWith('addr-1')
  })
})

import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IProfileAddressRepository } from '../../domain/repositories/profile-address.repository.js'
import { IRegionRepository } from '../../../reference-data/region/domain/repositories/region.repository.js'
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
    provinceCode: null,
    regencyCode: null,
    districtCode: null,
    villageCode: null,
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
  const regions = { findByCodes: jest.fn() }

  let service: ProfileAddressService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileAddressService,
        { provide: IProfileAddressRepository, useValue: repository },
        { provide: IRegionRepository, useValue: regions },
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

  describe('region codes', () => {
    const chain = [
      { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
      {
        code: '32.04',
        name: 'KABUPATEN BANDUNG',
        level: 'REGENCY',
        parentCode: '32',
      },
      {
        code: '32.04.01',
        name: 'CILEUNYI',
        level: 'DISTRICT',
        parentCode: '32.04',
      },
      {
        code: '32.04.01.2001',
        name: 'CIBIRU HILIR',
        level: 'VILLAGE',
        parentCode: '32.04.01',
      },
    ]
    const codes = {
      provinceCode: '32',
      regencyCode: '32.04',
      districtCode: '32.04.01',
      villageCode: '32.04.01.2001',
    }
    const submitted = {
      street: 'Jl. Veteran No. 1',
      rt: '001',
      rw: '002',
      village: 'typed by the client',
      district: 'typed by the client',
      city: 'typed by the client',
      province: 'typed by the client',
      postalCode: '65113',
    }

    beforeEach(() => {
      regions.findByCodes.mockResolvedValue(chain)
    })

    it('stores official names and codes for a valid chain', async () => {
      await service.add('user-1', { ...submitted, ...codes })

      expect(regions.findByCodes).toHaveBeenCalledTimes(1)
      expect(regions.findByCodes).toHaveBeenCalledWith([
        '32',
        '32.04',
        '32.04.01',
        '32.04.01.2001',
      ])
      expect(repository.create).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          province: 'JAWA BARAT',
          city: 'KABUPATEN BANDUNG',
          district: 'CILEUNYI',
          village: 'CIBIRU HILIR',
          ...codes,
        }),
      )
    })

    it('keeps a name-only address and stores null codes', async () => {
      await service.add('user-1', submitted)

      expect(regions.findByCodes).not.toHaveBeenCalled()
      expect(repository.create).toHaveBeenCalledWith('profile-1', {
        ...submitted,
        provinceCode: null,
        regencyCode: null,
        districtCode: null,
        villageCode: null,
      })
    })

    it.each([
      ['one code only', { provinceCode: '32' }],
      ['one explicit null code', { provinceCode: null }],
      [
        'three codes',
        {
          provinceCode: '32',
          regencyCode: '32.04',
          districtCode: '32.04.01',
        },
      ],
    ])(
      'refuses an incomplete chain (%s) without writing',
      async (_label, partial) => {
        await expect(
          service.add('user-1', { ...submitted, ...partial, isPrimary: true }),
        ).rejects.toBeInstanceOf(BadRequestException)

        expect(repository.create).not.toHaveBeenCalled()
        expect(repository.clearPrimary).not.toHaveBeenCalled()
      },
    )

    it.each([
      ['an unknown code', chain.slice(0, 3)],
      [
        'a record of the wrong level',
        [chain[0], chain[1], { ...chain[2], level: 'REGENCY' }, chain[3]],
      ],
      [
        'a child of another parent',
        [chain[0], chain[1], chain[2], { ...chain[3], parentCode: '32.04.99' }],
      ],
      [
        'a province that has a parent',
        [{ ...chain[0], parentCode: '99' }, chain[1], chain[2], chain[3]],
      ],
    ])('refuses %s without writing', async (_label, found) => {
      regions.findByCodes.mockResolvedValue(found)

      await expect(
        service.add('user-1', { ...submitted, ...codes }),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(repository.create).not.toHaveBeenCalled()
    })

    describe('update', () => {
      beforeEach(() => {
        repository.findByIdForProfile.mockResolvedValue({
          ...address,
          ...codes,
          province: 'JAWA BARAT',
          city: 'KABUPATEN BANDUNG',
          district: 'CILEUNYI',
          village: 'CIBIRU HILIR',
        })
      })

      it('canonicalises a complete chain', async () => {
        await service.update('user-1', 'addr-1', { ...submitted, ...codes })

        expect(repository.update).toHaveBeenCalledWith(
          'addr-1',
          expect.objectContaining({ village: 'CIBIRU HILIR', ...codes }),
        )
      })

      it('refuses a partial chain without writing', async () => {
        await expect(
          service.update('user-1', 'addr-1', {
            villageCode: '32.04.01.2001',
          }),
        ).rejects.toBeInstanceOf(BadRequestException)
        expect(repository.update).not.toHaveBeenCalled()
      })

      it('clears every stored code when a region name changes without codes', async () => {
        await service.update('user-1', 'addr-1', { city: 'Kota Bandung' })

        expect(repository.update).toHaveBeenCalledWith('addr-1', {
          city: 'Kota Bandung',
          provinceCode: null,
          regencyCode: null,
          districtCode: null,
          villageCode: null,
        })
      })

      it('keeps the codes when only whitespace around a region name changes', async () => {
        await service.update('user-1', 'addr-1', {
          city: '  KABUPATEN BANDUNG ',
        })

        expect(repository.update).toHaveBeenCalledWith('addr-1', {
          city: '  KABUPATEN BANDUNG ',
        })
      })

      it('leaves the codes alone when no region field is sent', async () => {
        await service.update('user-1', 'addr-1', { street: 'Jl. Baru 2' })

        expect(repository.update).toHaveBeenCalledWith('addr-1', {
          street: 'Jl. Baru 2',
        })
      })
    })
  })
})

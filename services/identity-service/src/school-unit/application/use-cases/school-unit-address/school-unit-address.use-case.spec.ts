import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ISchoolUnitAddressRepository } from '../../../domain/repositories/school-unit-address.repository.js'
import { ISchoolUnitRepository } from '../../../domain/repositories/school-unit.repository.js'
import { SchoolUnitAddressUseCase } from './school-unit-address.use-case.js'

describe('SchoolUnitAddressUseCase coordinates', () => {
  let useCase: SchoolUnitAddressUseCase

  const schoolUnits = { findFirst: jest.fn() }
  const addresses = {
    findBySchoolUnitId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  }

  const body = {
    street: 'Jl. Pesantren No. 2',
    rt: '001',
    rw: '002',
    village: 'Cibeureum',
    district: 'Cimahi Selatan',
    city: 'Cimahi',
    province: 'Jawa Barat',
    postalCode: '40535',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolUnitAddressUseCase,
        { provide: ISchoolUnitRepository, useValue: schoolUnits },
        { provide: ISchoolUnitAddressRepository, useValue: addresses },
      ],
    }).compile()

    useCase = module.get(SchoolUnitAddressUseCase)
    jest.clearAllMocks()
    schoolUnits.findFirst.mockResolvedValue({ id: 'unit-1' })
    addresses.create.mockImplementation((_id: string, input: unknown) => input)
    addresses.update.mockImplementation((_id: string, input: unknown) => input)
  })

  describe('setting the address', () => {
    beforeEach(() => addresses.findBySchoolUnitId.mockResolvedValue(null))

    it('accepts an address with no pin at all', async () => {
      await expect(useCase.setAddress({ ...body })).resolves.toBeDefined()
      expect(addresses.create).toHaveBeenCalled()
    })

    it('accepts a whole coordinate', async () => {
      await expect(
        useCase.setAddress({
          ...body,
          latitude: -6.914744,
          longitude: 107.60981,
        }),
      ).resolves.toBeDefined()
    })

    it('refuses a latitude with no longitude', async () => {
      await expect(
        useCase.setAddress({ ...body, latitude: -6.914744 }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(addresses.create).not.toHaveBeenCalled()
    })

    it('refuses a longitude with no latitude', async () => {
      await expect(
        useCase.setAddress({ ...body, longitude: 107.60981 }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(addresses.create).not.toHaveBeenCalled()
    })

    it('accepts zero as a coordinate', async () => {
      await expect(
        useCase.setAddress({ ...body, latitude: 0, longitude: 0 }),
      ).resolves.toBeDefined()
    })
  })

  describe('updating the address', () => {
    it('accepts one half when the address already holds both', async () => {
      addresses.findBySchoolUnitId.mockResolvedValue({
        id: 'addr-1',
        latitude: -6.9,
        longitude: 107.6,
      })

      await expect(
        useCase.updateAddress({ latitude: -6.914744 }),
      ).resolves.toBeDefined()
    })

    it('refuses one half when the address holds neither', async () => {
      addresses.findBySchoolUnitId.mockResolvedValue({
        id: 'addr-1',
        latitude: null,
        longitude: null,
      })

      await expect(
        useCase.updateAddress({ latitude: -6.914744 }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(addresses.update).not.toHaveBeenCalled()
    })

    it('refuses to clear only one half', async () => {
      addresses.findBySchoolUnitId.mockResolvedValue({
        id: 'addr-1',
        latitude: -6.9,
        longitude: 107.6,
      })

      await expect(
        useCase.updateAddress({ latitude: null }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('accepts clearing both halves', async () => {
      addresses.findBySchoolUnitId.mockResolvedValue({
        id: 'addr-1',
        latitude: -6.9,
        longitude: 107.6,
      })

      await expect(
        useCase.updateAddress({ latitude: null, longitude: null }),
      ).resolves.toBeDefined()
    })

    it('still refuses when there is no address to patch', async () => {
      addresses.findBySchoolUnitId.mockResolvedValue(null)

      await expect(
        useCase.updateAddress({ latitude: 1, longitude: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })
})

import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { ProvisionAccountAddressDto } from '../../../../user/presentation/http/dto/request/provision-account.dto.js'
import { CreateAddressDto as SchoolUnitAddressDto } from '../../../../shared/dto/address.dto.js'
import { RecordAddressDto } from '../address-internal.controller.js'
import type { AddressesForUserDto } from './response/address-response.dto.js'
import { CreateAddressDto, UpdateAddressDto } from './request/address.dto.js'
import { ProfileAddressResponseDto } from './response/profile-api-response.dto.js'

const base = {
  street: 'Jl. Veteran No. 1',
  rt: '001',
  rw: '002',
  village: 'Penanggungan',
  district: 'Klojen',
  city: 'Kota Malang',
  province: 'Jawa Timur',
  postalCode: '65113',
}
const codes = {
  provinceCode: '32',
  regencyCode: '32.04',
  districtCode: '32.04.01',
  villageCode: '32.04.01.2001',
}
const strict = { whitelist: true, forbidNonWhitelisted: true }

async function errors(type: new () => object, body: object) {
  return (await validate(plainToInstance(type, body), strict)).map(
    (error) => error.property,
  )
}

describe('region codes on address requests', () => {
  it('allows codes or no codes in profile create and update DTOs', async () => {
    await expect(
      errors(CreateAddressDto, { ...base, ...codes }),
    ).resolves.toEqual([])
    await expect(errors(CreateAddressDto, base)).resolves.toEqual([])
    await expect(errors(UpdateAddressDto, codes)).resolves.toEqual([])
    await expect(
      errors(UpdateAddressDto, { provinceCode: null }),
    ).resolves.toEqual([])
  })

  it('rejects region codes longer than storage column', async () => {
    await expect(
      errors(CreateAddressDto, { ...base, provinceCode: 'x'.repeat(14) }),
    ).resolves.toContain('provinceCode')
  })

  it('allows internal profile create DTO to carry region codes', async () => {
    expect(
      await errors(RecordAddressDto, {
        ...base,
        ...codes,
        userId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).toEqual([])
  })

  it('keeps account provisioning and school-unit address DTOs name-only', async () => {
    await expect(
      errors(ProvisionAccountAddressDto, { ...base, ...codes }),
    ).resolves.toContain('provinceCode')
    await expect(
      errors(SchoolUnitAddressDto, { ...base, ...codes }),
    ).resolves.toContain('provinceCode')
  })
})

describe('region codes in profile address responses', () => {
  const entity = {
    id: 'addr-1',
    ...base,
    country: 'Indonesia',
    isPrimary: false,
    latitude: null,
    longitude: null,
    ...codes,
  }

  it('maps stored codes to the profile address response', () => {
    expect(
      ProfileAddressResponseDto.fromDomain({ ...entity, ...codes }),
    ).toMatchObject(codes)
  })

  it('maps stored codes to the internal batch address response', () => {
    const result: AddressesForUserDto = {
      userId: 'user-1',
      addresses: [entity],
    }
    expect(result.addresses[0]).toMatchObject(codes)
  })

  it('maps name-only address codes as null', () => {
    expect(
      ProfileAddressResponseDto.fromDomain({
        ...entity,
        provinceCode: null,
        regencyCode: null,
        districtCode: null,
        villageCode: null,
      }),
    ).toMatchObject({ provinceCode: null, villageCode: null })
  })
})

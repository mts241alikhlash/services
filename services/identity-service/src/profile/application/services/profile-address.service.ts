import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  CreateProfileAddressRepositoryInput,
  IProfileAddressRepository,
  ProfileAddressEntity,
  UpdateProfileAddressRepositoryInput,
} from '../../domain/repositories/profile-address.repository.js'
import { IRegionRepository } from '../../../reference-data/region/domain/repositories/region.repository.js'

const REGION_LEVELS = ['PROVINCE', 'REGENCY', 'DISTRICT', 'VILLAGE'] as const
const CODE_FIELDS = [
  'provinceCode',
  'regencyCode',
  'districtCode',
  'villageCode',
] as const
const NAME_FIELDS = ['province', 'city', 'district', 'village'] as const
const NO_CODES = {
  provinceCode: null,
  regencyCode: null,
  districtCode: null,
  villageCode: null,
}

type RegionInput = Partial<
  Pick<CreateProfileAddressRepositoryInput, (typeof CODE_FIELDS)[number]>
>

@Injectable()
export class ProfileAddressService {
  constructor(
    private readonly addresses: IProfileAddressRepository,
    private readonly regions: IRegionRepository,
  ) {}

  async list(userId: string): Promise<ProfileAddressEntity[]> {
    const profileId = await this.profileIdOf(userId)
    return this.addresses.findAllByProfileId(profileId)
  }

  async add(
    userId: string,
    input: CreateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity> {
    const profileId = await this.profileIdOf(userId)
    const region = await this.canonicalRegion(input)
    const data = region ? { ...input, ...region } : { ...input, ...NO_CODES }

    if (data.isPrimary) {
      await this.addresses.clearPrimary(profileId)
    }

    return this.addresses.create(profileId, data)
  }

  async update(
    userId: string,
    addressId: string,
    input: UpdateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity> {
    const profileId = await this.profileIdOf(userId)
    const current = await this.ownedOrFail(addressId, profileId)
    const region = await this.canonicalRegion(input)
    const data = region
      ? { ...input, ...region }
      : this.withoutStaleCodes(input, current)

    if (data.isPrimary) {
      await this.addresses.clearPrimary(profileId, addressId)
    }

    return this.addresses.update(addressId, data)
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const profileId = await this.profileIdOf(userId)
    await this.ownedOrFail(addressId, profileId)
    await this.addresses.softDelete(addressId)
  }

  private async profileIdOf(userId: string): Promise<string> {
    const profileId = await this.addresses.findProfileIdByUserId(userId)
    if (!profileId) {
      throw new NotFoundException(`Profile for user ID ${userId} not found`)
    }
    return profileId
  }

  private async ownedOrFail(addressId: string, profileId: string) {
    const address = await this.addresses.findByIdForProfile(
      addressId,
      profileId,
    )
    if (!address) {
      throw new NotFoundException(`Address ${addressId} not found`)
    }
    return address
  }

  private async canonicalRegion(input: RegionInput) {
    const codes = CODE_FIELDS.map((field) => input[field] || null)
    const codeFieldsProvided = CODE_FIELDS.filter(
      (field) => input[field] !== undefined,
    ).length
    const supplied = codes.filter((code): code is string => code !== null)
    if (codeFieldsProvided > 0 && codeFieldsProvided < CODE_FIELDS.length) {
      throw new BadRequestException(
        'Kode wilayah harus lengkap: provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan',
      )
    }
    if (supplied.length === 0) return null
    if (supplied.length !== CODE_FIELDS.length) {
      throw new BadRequestException(
        'Kode wilayah harus lengkap: provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan',
      )
    }

    const found = new Map(
      (await this.regions.findByCodes(supplied)).map((region) => [
        region.code,
        region,
      ]),
    )
    const chain = supplied.map((code, index) => {
      const region = found.get(code)
      const parent = index === 0 ? null : supplied[index - 1]
      if (
        region?.level !== REGION_LEVELS[index] ||
        region?.parentCode !== parent
      ) {
        throw new BadRequestException(
          'Kode wilayah tidak valid atau tidak berurutan',
        )
      }
      return region
    })

    return {
      provinceCode: supplied[0],
      regencyCode: supplied[1],
      districtCode: supplied[2],
      villageCode: supplied[3],
      province: chain[0].name,
      city: chain[1].name,
      district: chain[2].name,
      village: chain[3].name,
    }
  }

  private withoutStaleCodes(
    input: UpdateProfileAddressRepositoryInput,
    current: ProfileAddressEntity,
  ) {
    const renamed = NAME_FIELDS.some((field) => {
      const next = input[field]
      return next !== undefined && next.trim() !== current[field].trim()
    })
    return renamed ? { ...input, ...NO_CODES } : input
  }
}

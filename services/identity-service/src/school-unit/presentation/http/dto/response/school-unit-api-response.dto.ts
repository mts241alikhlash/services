import type { SchoolUnitSocialMediaEntity } from '../../../../domain/entities/school-unit-social-media.entity.js'
import type { AddressEntity } from '../../../../../shared/domain/entities/address.entity.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { SchoolUnitWithDetails } from '../../../../domain/entities/school-unit.entity.js'

export class SchoolUnitDetailResponseTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<SchoolUnitWithDetails['type']>,
  ): SchoolUnitDetailResponseTypeDto {
    const dto = new SchoolUnitDetailResponseTypeDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class SchoolUnitDetailResponseAddressesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  schoolUnitId?: string | null

  @ApiProperty({ type: String })
  street!: string

  @ApiProperty({ type: String })
  rt!: string

  @ApiProperty({ type: String })
  rw!: string

  @ApiProperty({ type: String })
  village!: string

  @ApiProperty({ type: String })
  district!: string

  @ApiProperty({ type: String })
  city!: string

  @ApiProperty({ type: String })
  province!: string

  @ApiProperty({ type: String })
  country!: string

  @ApiProperty({ type: String })
  postalCode!: string

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiPropertyOptional({ type: Number, nullable: true })
  latitude?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  longitude?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  profileId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<SchoolUnitWithDetails['addresses']>[number]
    >,
  ): SchoolUnitDetailResponseAddressesDto {
    const dto = new SchoolUnitDetailResponseAddressesDto()
    dto.id = domain.id
    dto.schoolUnitId = domain.schoolUnitId
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.country = domain.country
    dto.postalCode = domain.postalCode
    dto.isPrimary = domain.isPrimary
    dto.latitude = domain.latitude
    dto.longitude = domain.longitude
    dto.profileId = domain.profileId
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    return dto
  }
}

export class SchoolUnitDetailResponseSocialMediasSocialMediaDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<SchoolUnitWithDetails['socialMedias']>[number]
      >['socialMedia']
    >,
  ): SchoolUnitDetailResponseSocialMediasSocialMediaDto {
    const dto = new SchoolUnitDetailResponseSocialMediasSocialMediaDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class SchoolUnitDetailResponseSocialMediasDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  socialMediaId!: string

  @ApiProperty({ type: String, nullable: true })
  username!: string | null

  @ApiPropertyOptional({
    type: () => SchoolUnitDetailResponseSocialMediasSocialMediaDto,
  })
  socialMedia?: SchoolUnitDetailResponseSocialMediasSocialMediaDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<SchoolUnitWithDetails['socialMedias']>[number]
    >,
  ): SchoolUnitDetailResponseSocialMediasDto {
    const dto = new SchoolUnitDetailResponseSocialMediasDto()
    dto.id = domain.id
    dto.socialMediaId = domain.socialMediaId
    dto.username = domain.username
    if (domain.socialMedia !== undefined)
      dto.socialMedia =
        domain.socialMedia == null
          ? domain.socialMedia
          : SchoolUnitDetailResponseSocialMediasSocialMediaDto.fromDomain(
              domain.socialMedia,
            )
    return dto
  }
}

export class SchoolUnitDetailResponseDto {
  @ApiPropertyOptional({
    type: () => SchoolUnitDetailResponseTypeDto,
    nullable: true,
  })
  type?: SchoolUnitDetailResponseTypeDto | null

  @ApiPropertyOptional({
    type: () => SchoolUnitDetailResponseAddressesDto,
    isArray: true,
  })
  addresses?: SchoolUnitDetailResponseAddressesDto[]

  @ApiPropertyOptional({
    type: () => SchoolUnitDetailResponseSocialMediasDto,
    isArray: true,
  })
  socialMedias?: SchoolUnitDetailResponseSocialMediasDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  typeId?: string | null

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String })
  surname?: string

  @ApiPropertyOptional({ type: String })
  nsm?: string

  @ApiPropertyOptional({ type: String })
  npsn?: string

  @ApiPropertyOptional({ enum: ['PRIVATE', 'PUBLIC'] })
  status?: 'PRIVATE' | 'PUBLIC'

  @ApiPropertyOptional({ type: String })
  npwp?: string

  @ApiPropertyOptional({ type: String })
  phone?: string

  @ApiPropertyOptional({ type: String })
  email?: string

  @ApiPropertyOptional({ type: String })
  website?: string

  @ApiPropertyOptional({ type: Boolean })
  isActive?: boolean

  static fromDomain(
    domain: SchoolUnitWithDetails,
  ): SchoolUnitDetailResponseDto {
    const dto = new SchoolUnitDetailResponseDto()
    if (domain.type !== undefined)
      dto.type =
        domain.type == null
          ? domain.type
          : SchoolUnitDetailResponseTypeDto.fromDomain(domain.type)
    if (domain.addresses !== undefined)
      dto.addresses =
        domain.addresses == null
          ? domain.addresses
          : domain.addresses.map((x) =>
              SchoolUnitDetailResponseAddressesDto.fromDomain(x),
            )
    if (domain.socialMedias !== undefined)
      dto.socialMedias =
        domain.socialMedias == null
          ? domain.socialMedias
          : domain.socialMedias.map((x) =>
              SchoolUnitDetailResponseSocialMediasDto.fromDomain(x),
            )
    dto.id = domain.id
    dto.typeId = domain.typeId
    dto.name = domain.name
    dto.surname = domain.surname
    dto.nsm = domain.nsm
    dto.npsn = domain.npsn
    dto.status = domain.status
    dto.npwp = domain.npwp
    dto.phone = domain.phone
    dto.email = domain.email
    dto.website = domain.website
    dto.isActive = domain.isActive
    return dto
  }
}

export class SchoolUnitAddressResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  schoolUnitId?: string | null

  @ApiProperty({ type: String })
  street!: string

  @ApiProperty({ type: String })
  rt!: string

  @ApiProperty({ type: String })
  rw!: string

  @ApiProperty({ type: String })
  village!: string

  @ApiProperty({ type: String })
  district!: string

  @ApiProperty({ type: String })
  city!: string

  @ApiProperty({ type: String })
  province!: string

  @ApiProperty({ type: String })
  country!: string

  @ApiProperty({ type: String })
  postalCode!: string

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiPropertyOptional({ type: Number, nullable: true })
  latitude?: number | null

  @ApiPropertyOptional({ type: Number, nullable: true })
  longitude?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  profileId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  provinceCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  regencyCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  districtCode?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  villageCode?: string | null

  static fromDomain(domain: AddressEntity): SchoolUnitAddressResponseDto {
    const dto = new SchoolUnitAddressResponseDto()
    dto.id = domain.id
    dto.schoolUnitId = domain.schoolUnitId
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.country = domain.country
    dto.postalCode = domain.postalCode
    dto.isPrimary = domain.isPrimary
    dto.latitude = domain.latitude
    dto.longitude = domain.longitude
    dto.profileId = domain.profileId
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    return dto
  }
}

export class SchoolUnitSocialMediaItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  schoolUnitId!: string

  @ApiProperty({ type: String })
  socialMediaId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  username?: string | null

  static fromDomain(
    domain: SchoolUnitSocialMediaEntity,
  ): SchoolUnitSocialMediaItemResponseDto {
    const dto = new SchoolUnitSocialMediaItemResponseDto()
    dto.id = domain.id
    dto.schoolUnitId = domain.schoolUnitId
    dto.socialMediaId = domain.socialMediaId
    dto.username = domain.username
    return dto
  }
}

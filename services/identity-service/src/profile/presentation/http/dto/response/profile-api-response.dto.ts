import type { ProfileAddressEntity } from '../../../../domain/repositories/profile-address.repository.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ProfileWithAvatarUrl } from '../../../../application/services/profile-avatar-url.service.js'

export class ProfileWithAvatarResponseReligionDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<ProfileWithAvatarUrl['religion']>,
  ): ProfileWithAvatarResponseReligionDto {
    const dto = new ProfileWithAvatarResponseReligionDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class ProfileWithAvatarResponseBloodTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<ProfileWithAvatarUrl['bloodType']>,
  ): ProfileWithAvatarResponseBloodTypeDto {
    const dto = new ProfileWithAvatarResponseBloodTypeDto()
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class ProfileWithAvatarResponseAvatarFileDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  filename!: string

  @ApiProperty({ type: String })
  originalName!: string

  @ApiProperty({ type: String })
  mimeType!: string

  @ApiProperty({ type: Number })
  sizeBytes!: number

  @ApiProperty({ type: String })
  storageKey!: string

  static fromDomain(
    domain: NonNullable<ProfileWithAvatarUrl['avatarFile']>,
  ): ProfileWithAvatarResponseAvatarFileDto {
    const dto = new ProfileWithAvatarResponseAvatarFileDto()
    dto.id = domain.id
    dto.filename = domain.filename
    dto.originalName = domain.originalName
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    dto.storageKey = domain.storageKey
    return dto
  }
}

export class ProfileWithAvatarResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  nik!: string

  @ApiProperty({ enum: ['MALE', 'FEMALE'] })
  gender!: 'MALE' | 'FEMALE'

  @ApiProperty({ type: String })
  birthPlace!: string

  @ApiProperty({ type: String, format: 'date-time' })
  birthDate!: string

  @ApiProperty({ type: String, nullable: true })
  email!: string | null

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null

  @ApiProperty({
    enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
    nullable: true,
  })
  maritalStatus!: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | null

  @ApiProperty({ type: String, nullable: true })
  noKk!: string | null

  @ApiProperty({ type: String, nullable: true })
  npwp!: string | null

  @ApiProperty({
    type: () => ProfileWithAvatarResponseReligionDto,
    nullable: true,
  })
  religion!: ProfileWithAvatarResponseReligionDto | null

  @ApiProperty({
    type: () => ProfileWithAvatarResponseBloodTypeDto,
    nullable: true,
  })
  bloodType!: ProfileWithAvatarResponseBloodTypeDto | null

  @ApiProperty({
    type: () => ProfileWithAvatarResponseAvatarFileDto,
    nullable: true,
  })
  avatarFile!: ProfileWithAvatarResponseAvatarFileDto | null

  @ApiProperty({ type: String, nullable: true })
  avatarUrl!: string | null

  static fromDomain(
    domain: ProfileWithAvatarUrl,
  ): ProfileWithAvatarResponseDto {
    const dto = new ProfileWithAvatarResponseDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    dto.name = domain.name
    dto.nik = domain.nik
    dto.gender = domain.gender
    dto.birthPlace = domain.birthPlace
    dto.birthDate = domain.birthDate.toISOString()
    dto.email = domain.email
    dto.phone = domain.phone
    dto.maritalStatus = domain.maritalStatus
    dto.noKk = domain.noKk
    dto.npwp = domain.npwp
    dto.religion =
      domain.religion == null
        ? domain.religion
        : ProfileWithAvatarResponseReligionDto.fromDomain(domain.religion)
    dto.bloodType =
      domain.bloodType == null
        ? domain.bloodType
        : ProfileWithAvatarResponseBloodTypeDto.fromDomain(domain.bloodType)
    dto.avatarFile =
      domain.avatarFile == null
        ? domain.avatarFile
        : ProfileWithAvatarResponseAvatarFileDto.fromDomain(domain.avatarFile)
    dto.avatarUrl = domain.avatarUrl
    return dto
  }
}

export class ProfileAddressResponseDto {
  @ApiProperty({ type: String })
  id!: string

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

  @ApiProperty({ type: String, nullable: true })
  provinceCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  regencyCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  districtCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  villageCode!: string | null

  @ApiProperty({ type: String })
  country!: string

  @ApiProperty({ type: String })
  postalCode!: string

  @ApiProperty({ type: Boolean })
  isPrimary!: boolean

  @ApiProperty({ type: Number, nullable: true })
  latitude!: number | null

  @ApiProperty({ type: Number, nullable: true })
  longitude!: number | null

  static fromDomain(domain: ProfileAddressEntity): ProfileAddressResponseDto {
    const dto = new ProfileAddressResponseDto()
    dto.id = domain.id
    dto.street = domain.street
    dto.rt = domain.rt
    dto.rw = domain.rw
    dto.village = domain.village
    dto.district = domain.district
    dto.city = domain.city
    dto.province = domain.province
    dto.provinceCode = domain.provinceCode
    dto.regencyCode = domain.regencyCode
    dto.districtCode = domain.districtCode
    dto.villageCode = domain.villageCode
    dto.country = domain.country
    dto.postalCode = domain.postalCode
    dto.isPrimary = domain.isPrimary
    dto.latitude = domain.latitude
    dto.longitude = domain.longitude
    return dto
  }
}

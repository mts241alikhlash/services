import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MaritalStatus } from '../../../../../shared/domain/enums/marital-status.enum.js'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'

export class ProfileReferenceDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ example: 'Islam' }) name!: string
}

export class ProfileAvatarDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() filename!: string
  @ApiProperty() originalName!: string
  @ApiProperty({ example: 'image/webp' }) mimeType!: string
  @ApiProperty({ example: 48213 }) sizeBytes!: number
  @ApiProperty({
    description:
      'Object key in the bucket. Render the photo from `avatarUrl` instead; ' +
      'this is here for a caller that resolves keys itself.',
  })
  storageKey!: string
}

export class ProfileDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) userId!: string
  @ApiProperty({
    example: '2024001',
    description: 'The sign-in identifier on the account behind this profile.',
  })
  identifier!: string
  @ApiProperty({ example: true }) isActive!: boolean
  @ApiProperty({ example: 'Ahmad Fauzi' }) name!: string
  @ApiProperty({ example: '3578010101080001' }) nik!: string
  @ApiProperty({ enum: UserGender }) gender!: UserGender
  @ApiProperty({ example: 'Bandung' }) birthPlace!: string
  @ApiProperty({ format: 'date-time' }) birthDate!: Date
  @ApiPropertyOptional({ nullable: true }) email!: string | null
  @ApiPropertyOptional({ nullable: true }) phone!: string | null
  @ApiPropertyOptional({ enum: MaritalStatus, nullable: true })
  maritalStatus!: MaritalStatus | null
  @ApiPropertyOptional({ nullable: true }) noKk!: string | null
  @ApiPropertyOptional({ nullable: true }) npwp!: string | null
  @ApiPropertyOptional({ type: () => ProfileReferenceDto, nullable: true })
  religion!: ProfileReferenceDto | null
  @ApiPropertyOptional({ type: () => ProfileReferenceDto, nullable: true })
  bloodType!: ProfileReferenceDto | null
  @ApiPropertyOptional({ type: () => ProfileAvatarDto, nullable: true })
  avatarFile!: ProfileAvatarDto | null

  @ApiPropertyOptional({
    nullable: true,
    description:
      'A presigned GET URL for the photo, valid for S3_SIGNED_URL_EXPIRY_SECONDS. ' +
      'Null when there is no photo, or when object storage is not configured.',
  })
  avatarUrl!: string | null
}

export class ProfileSingleResponseDto {
  @ApiProperty({ type: () => ProfileDto })
  data!: ProfileDto
}

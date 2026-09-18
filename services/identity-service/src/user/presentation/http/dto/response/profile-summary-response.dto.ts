import { ApiProperty } from '@nestjs/swagger'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'

export class ProfileSummaryResponseDto {
  @ApiProperty({ example: '9a9e3ee8-4a56-4c74-a029-798dfb0a3909' })
  userId!: string

  @ApiProperty({ example: 'guru001' })
  identifier!: string

  @ApiProperty({ example: true })
  isActive!: boolean

  @ApiProperty({ example: 'Ahmad Fauzi' })
  name!: string

  @ApiProperty({ enum: UserGender, example: UserGender.MALE })
  gender!: UserGender

  @ApiProperty({ example: '3578012345678901' })
  nik!: string

  @ApiProperty({
    example: 'avatars/9a9e3ee8.jpg',
    nullable: true,
    description: 'Object storage key. Null when no avatar has been uploaded.',
  })
  avatarStorageKey!: string | null

  @ApiProperty({ example: 'Surabaya' })
  birthPlace!: string

  @ApiProperty({ example: '1980-06-15T00:00:00.000Z' })
  birthDate!: Date

  @ApiProperty({ example: 'budi@example.com', nullable: true })
  email!: string | null

  @ApiProperty({ example: '081234567890', nullable: true })
  phone!: string | null
}

export class BatchProfileLookupResponseDto {
  @ApiProperty({ type: () => [ProfileSummaryResponseDto] })
  data!: ProfileSummaryResponseDto[]
}

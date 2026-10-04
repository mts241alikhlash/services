import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'

export class AccountProfileResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  userId!: string

  @ApiProperty({ example: 'Budi Santoso' })
  name!: string

  @ApiProperty({ example: '3578010101700001' })
  nik!: string

  @ApiProperty({ enum: UserGender, example: 'MALE' })
  gender!: UserGender

  @ApiProperty({ example: 'Surabaya' })
  birthPlace!: string

  @ApiProperty({ example: '1980-06-15T00:00:00.000Z' })
  birthDate!: Date

  @ApiPropertyOptional({ example: 'budi@example.com', nullable: true })
  email!: string | null

  @ApiPropertyOptional({ example: '081234567890', nullable: true })
  phone!: string | null
}

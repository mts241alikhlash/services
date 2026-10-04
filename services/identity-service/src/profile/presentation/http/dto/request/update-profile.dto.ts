import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'
import { MaritalStatus } from '../../../../../shared/domain/enums/marital-status.enum.js'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ahmad Fauzi', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: '3578010101080001', maxLength: 16 })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  nik?: string

  @ApiPropertyOptional({ enum: UserGender })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender

  @ApiPropertyOptional({ example: 'Bandung', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  birthPlace?: string

  @ApiPropertyOptional({ example: '2008-01-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional({ example: 'ahmad.fauzi@example.com', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string

  @ApiPropertyOptional({ example: '081234567890', maxLength: 15 })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone?: string

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'From GET /religions. Refused when the id is unknown.',
  })
  @IsOptional()
  @IsUUID()
  religionId?: string

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'From GET /blood-types. Refused when the id is unknown.',
  })
  @IsOptional()
  @IsUUID()
  bloodTypeId?: string

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus

  @ApiPropertyOptional({ example: '3578010101080001', maxLength: 16 })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  noKk?: string

  @ApiPropertyOptional({ example: '12.345.678.9-012.000', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  npwp?: string
}

import { ApiPropertyOptional } from '@nestjs/swagger'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class UpdateAccountProfileDto {
  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @ApiPropertyOptional({ example: '3578010101700001' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  nik?: string

  @ApiPropertyOptional({ enum: UserGender, example: 'MALE' })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender

  @ApiPropertyOptional({ example: 'Surabaya' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  birthPlace?: string

  @ApiPropertyOptional({ example: '1980-06-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional({ example: 'budi@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone?: string
}

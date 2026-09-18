import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'
import { Type } from 'class-transformer'
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

export class ProvisionAccountAddressDto {
  @ApiProperty({ example: 'Jl. Veteran No. 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street: string

  @ApiProperty({ example: '001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  rt: string

  @ApiProperty({ example: '002' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  rw: string

  @ApiProperty({ example: 'Penanggungan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  village: string

  @ApiProperty({ example: 'Klojen' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  district: string

  @ApiProperty({ example: 'Kota Malang' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string

  @ApiProperty({ example: 'Jawa Timur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string

  @ApiPropertyOptional({ example: 'Indonesia', default: 'Indonesia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string

  @ApiProperty({ example: '65113' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  postalCode: string
}

export class ProvisionAccountProfileDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({ example: '3578010101700001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  nik: string

  @ApiProperty({ enum: UserGender, example: 'MALE' })
  @IsEnum(UserGender)
  gender: UserGender

  @ApiProperty({ example: 'Surabaya' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  birthPlace: string

  @ApiProperty({ example: '1980-06-15' })
  @IsDateString()
  birthDate: string

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

  @ApiPropertyOptional({
    type: ProvisionAccountAddressDto,
    description:
      'The person’s home address. Written in the same transaction as the profile, because this service owns both — hr-service and student-service read it back, they do not keep their own copy.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProvisionAccountAddressDto)
  address?: ProvisionAccountAddressDto
}

export class ProvisionAccountDto {
  @ApiProperty({ example: 'guru001', minLength: 3, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  identifier: string

  @ApiProperty({
    description:
      'Already bcrypt-hashed by the caller. Never a plaintext password.',
  })
  @IsString()
  @IsNotEmpty()
  passwordHash: string

  @ApiPropertyOptional({ example: 'TEACHER' })
  @IsOptional()
  @IsString()
  roleCode?: string

  @ApiPropertyOptional({ type: ProvisionAccountProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProvisionAccountProfileDto)
  profile?: ProvisionAccountProfileDto
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { UserGender } from '../../../../../shared/domain/enums/user-gender.enum.js'
import { ParentRelation } from '../../../../../shared/domain/enums/parent-relation.enum.js'
import { IncomeRange } from '../../../../../shared/domain/enums/income-range.enum.js'

export class EnrolParentDto {
  @ApiProperty({ example: 'Ahmad Fauzi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({ example: '3204010101800001' })
  @IsString()
  @IsNotEmpty()
  nik: string

  @ApiProperty({ example: 'Bandung' })
  @IsString()
  @IsNotEmpty()
  birthPlace: string

  @ApiProperty({ example: '1980-01-01' })
  @IsDateString()
  birthDate: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty()
  @IsUUID()
  occupationId: string

  @ApiPropertyOptional({ enum: IncomeRange })
  @IsOptional()
  @IsEnum(IncomeRange)
  income?: IncomeRange

  @ApiProperty({ enum: ParentRelation, example: ParentRelation.FATHER })
  @IsEnum(ParentRelation)
  relation: ParentRelation

  @ApiPropertyOptional()
  @IsOptional()
  isPrimary?: boolean
}

export class EnrolProfileDto {
  @ApiProperty({ example: 'Siti Nurhaliza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({ example: '3204014504100002' })
  @IsString()
  @IsNotEmpty()
  nik: string

  @ApiProperty({ enum: UserGender })
  @IsEnum(UserGender)
  gender: UserGender

  @ApiProperty({ example: 'Bandung' })
  @IsString()
  @IsNotEmpty()
  birthPlace: string

  @ApiProperty({ example: '2010-04-05' })
  @IsDateString()
  birthDate: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  religionId?: string
}

export class EnrolAddressDto {
  @ApiProperty() @IsString() @IsNotEmpty() street: string
  @ApiProperty() @IsString() @IsNotEmpty() rt: string
  @ApiProperty() @IsString() @IsNotEmpty() rw: string
  @ApiProperty() @IsString() @IsNotEmpty() village: string
  @ApiProperty() @IsString() @IsNotEmpty() district: string
  @ApiProperty() @IsString() @IsNotEmpty() city: string
  @ApiProperty() @IsString() @IsNotEmpty() province: string
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string
  @ApiProperty() @IsString() @IsNotEmpty() postalCode: string
}

export class EnrolExistingAccountDto {
  @ApiPropertyOptional({ description: 'Admission operation identifier' })
  @IsOptional()
  @IsUUID()
  applicationId?: string

  @ApiProperty({ description: 'Existing user account to enrol' })
  @IsUUID()
  userId: string

  @ApiProperty({ example: '2026001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nis: string

  @ApiProperty({ example: '0101234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nisn: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  gradeId?: string

  @ApiPropertyOptional({ description: 'Enrols into the active semester' })
  @IsOptional()
  @IsUUID()
  classroomId?: string

  @ApiProperty({ type: EnrolProfileDto })
  @ValidateNested()
  @Type(() => EnrolProfileDto)
  profile: EnrolProfileDto

  @ApiPropertyOptional({ type: [EnrolParentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnrolParentDto)
  parents?: EnrolParentDto[]

  @ApiPropertyOptional({ type: EnrolAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EnrolAddressDto)
  address?: EnrolAddressDto
}

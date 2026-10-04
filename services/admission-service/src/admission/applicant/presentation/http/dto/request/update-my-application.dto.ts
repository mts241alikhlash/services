import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ParentRelation } from '../../../../../../shared/domain/enums/parent-relation.enum.js'
import { UserGender } from '../../../../../../shared/domain/enums/user-gender.enum.js'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

const REGION_CODE = /^(\d{2}(\.\d{2}(\.\d{2}(\.\d{4})?)?)?)?$/

export class UpdateApplicationParentDto {
  @ApiProperty({ enum: ParentRelation })
  @IsEnum(ParentRelation)
  relation: ParentRelation

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{16}$/, { message: 'nik must be 16 digits' })
  nik?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  birthPlace?: string

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^(\+62|0)8\d{8,11}$/, {
    message: 'phone must be an Indonesian mobile number',
  })
  phone?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  occupationId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  educationId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  incomeRangeId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lifeStatusId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  domicileId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  residenceId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sameAddressAsStudent?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,3}$/, { message: 'rt must be 1 to 3 digits' })
  rt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,3}$/, { message: 'rw must be 1 to 3 digits' })
  rw?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'postalCode must be 5 digits' })
  postalCode?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  provinceCode?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  regencyCode?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  districtCode?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  villageCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

export class UpdateApplicationAchievementDto {
  @ApiProperty({ minimum: 1990, maximum: 2100 })
  @IsInt()
  @Min(1990)
  @Max(2100)
  year: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  competitionName: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  competitionFieldId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  organizer?: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  competitionLevelId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  rank!: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string
}

export class UpdateApplicationScholarshipDto {
  @ApiProperty({ minimum: 1990, maximum: 2100 })
  @IsInt()
  @Min(1990)
  @Max(2100)
  year: number

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  scholarshipName: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  providerName!: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  providerTypeId!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  kipNumber?: string

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string
}

export class UpdateMyApplicationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string

  @ApiPropertyOptional({ enum: UserGender })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  birthPlace?: string

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{16}$/, { message: 'nik must be 16 digits' })
  nik?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'nisn must be 10 digits' })
  nisn?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  religionId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^(\+62|0)8\d{8,11}$/, {
    message: 'phone must be an Indonesian mobile number',
  })
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  childOrder?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  siblingCount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,3}$/, { message: 'rt must be 1 to 3 digits' })
  rt?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,3}$/, { message: 'rw must be 1 to 3 digits' })
  rw?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'postalCode must be 5 digits' })
  postalCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  hobby?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  aspiration?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  financingSourceId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  disabilityTypeId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  specialNeedId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentResidenceId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  travelDistanceId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  travelTimeId?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  transportationId?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  provinceCode?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  regencyCode?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  districtCode?: string

  @ApiPropertyOptional({ example: '32.04' })
  @IsOptional()
  @IsString()
  @Matches(REGION_CODE)
  villageCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  previousSchoolName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'previousSchoolNpsn must be 8 digits' })
  previousSchoolNpsn?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  previousSchoolAddress?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  graduationYear?: number

  @ApiPropertyOptional({ type: [UpdateApplicationParentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => UpdateApplicationParentDto)
  parents?: UpdateApplicationParentDto[]

  @ApiPropertyOptional({ type: [UpdateApplicationAchievementDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UpdateApplicationAchievementDto)
  achievements?: UpdateApplicationAchievementDto[]

  @ApiPropertyOptional({ type: [UpdateApplicationScholarshipDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UpdateApplicationScholarshipDto)
  scholarships?: UpdateApplicationScholarshipDto[]
}

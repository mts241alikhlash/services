import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import {
  MAKEUP_REASONS,
  type MakeupReason,
} from '../../../../domain/entities/exam-schedule.entity.js'

const HAS_TIME_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i

export class MakeupParticipantDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() studentId!: string

  @ApiProperty({ enum: MAKEUP_REASONS })
  @IsIn(MAKEUP_REASONS)
  reason!: MakeupReason

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string | null
}

export class CreateMakeupDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  packageId?: string

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  @Matches(HAS_TIME_ZONE, { message: 'startsAt must include a time zone' })
  startsAt!: string

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  @Matches(HAS_TIME_ZONE, { message: 'endsAt must include a time zone' })
  endsAt!: string

  @ApiProperty({ minimum: 1, maximum: 1440 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number

  @ApiProperty({ type: () => [MakeupParticipantDto], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MakeupParticipantDto)
  participants!: MakeupParticipantDto[]
}

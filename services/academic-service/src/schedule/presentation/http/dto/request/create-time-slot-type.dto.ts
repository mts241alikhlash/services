import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DayEnum as Day } from '../../../../../shared/domain/enums/day.enum.js'
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateTimeSlotTypeDto {
  @ApiProperty({ example: 'CEREMONY' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string

  @ApiProperty({ example: 'Upacara' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiPropertyOptional({
    example: false,
    default: true,
    description:
      'Regular lesson slot (can hold a subject). false for ceremony/break/tahfidz.',
  })
  @IsOptional()
  @IsBoolean()
  isLesson?: boolean

  @ApiPropertyOptional({
    enum: Day,
    isArray: true,
    example: ['MONDAY'],
    description: 'Weekdays this type applies to; omit/empty means every day.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Day, { each: true })
  @ArrayUnique()
  days?: Day[]

  @ApiPropertyOptional({
    example: 40,
    default: 40,
    minimum: 1,
    maximum: 600,
    description:
      'How long a slot of this type usually runs, in minutes. Fills in the end time when a slot is added; does not constrain a saved one.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  defaultDurationMinutes?: number
}

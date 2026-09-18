import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

import {
  ACADEMIC_YEAR_NAME_MAX_LENGTH,
  ACADEMIC_YEAR_START_YEAR_MAX,
  ACADEMIC_YEAR_START_YEAR_MIN,
} from '../../../../constants/academic-year.constants.js'

export class CreateAcademicYearDto {
  @ApiProperty({
    description: 'Academic Year Name (e.g., 2024/2025)',
    example: '2025/2026',
    maxLength: ACADEMIC_YEAR_NAME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACADEMIC_YEAR_NAME_MAX_LENGTH)
  name: string

  @ApiProperty({
    description:
      'The calendar year this school year opens in: 2026 for "2026/2027". ' +
      'Given rather than parsed out of the name — years are master data the ' +
      'school renames, and everything that needs them in order reads this.',
    example: 2026,
  })
  @IsInt()
  @Min(ACADEMIC_YEAR_START_YEAR_MIN)
  @Max(ACADEMIC_YEAR_START_YEAR_MAX)
  startYear: number

  @ApiPropertyOptional({
    description: 'Is current active academic year?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

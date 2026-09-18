import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateClassroomDto {
  @ApiProperty({ description: 'Academic Year ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string

  @ApiProperty({ description: 'Grade ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  gradeId: string

  @ApiProperty({
    description:
      'What the school calls the class, and the only unique one: a grade has ' +
      'exactly one of each. Human-typed and human-read, so it is also the key ' +
      'the student import spreadsheet matches on.',
    example: 'VII A',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string

  @ApiPropertyOptional({
    description:
      'An alias the school also uses for this class. Decoration, never an ' +
      'identifier — two classes may share one.',
    example: 'Awesome',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @ApiProperty({ description: 'Class Capacity', example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity: number

  @ApiPropertyOptional({ description: 'Active Status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

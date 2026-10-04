import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ParentRelation } from '../../../../../shared/domain/enums/parent-relation.enum.js'
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator'

export class CreateStudentParentDto {
  @ApiProperty({
    description: 'Student ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  studentId: string

  @ApiProperty({
    description: 'Parent ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  @IsNotEmpty()
  parentId: string

  @ApiProperty({
    enum: ParentRelation,
    example: 'FATHER',
    description: 'Relation: FATHER, MOTHER, GUARDIAN',
  })
  @IsEnum(ParentRelation)
  @IsNotEmpty()
  relation: ParentRelation

  @ApiPropertyOptional({
    description: 'Whether this parent is the primary contact',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

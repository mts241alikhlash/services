import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

export class AcceptManyDto {
  @ApiProperty({ type: [String], format: 'uuid', minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  applicationIds!: string[]

  @ApiPropertyOptional({ description: 'Shown to every accepted applicant' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string
}

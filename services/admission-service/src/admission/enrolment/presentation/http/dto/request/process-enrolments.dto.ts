import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class ProcessNisnDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  applicationId!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nisn!: string
}

export class ProcessEnrolmentsDto {
  @ApiProperty({ type: [String], format: 'uuid', minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  applicationIds!: string[]

  @ApiPropertyOptional({ type: () => [ProcessNisnDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessNisnDto)
  nisn?: ProcessNisnDto[]
}

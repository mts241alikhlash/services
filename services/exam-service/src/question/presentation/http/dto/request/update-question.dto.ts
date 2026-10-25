import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  bodyHtml?: string

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>

  @ApiPropertyOptional({ minimum: 0.25, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(100)
  points?: number
}

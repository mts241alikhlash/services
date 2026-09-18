import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsObject,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import type { JsonObject } from '../../../../../shared/domain/types/json.type.js'

export class IngestAuditLogDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string

  @ApiProperty({ example: 'daily-record.correct' })
  @IsString()
  @IsNotEmpty()
  action!: string

  @ApiProperty({ example: 'daily-records' })
  @IsString()
  @IsNotEmpty()
  resource!: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string

  @ApiPropertyOptional({ description: 'Arbitrary JSON, e.g. before/after' })
  @IsOptional()
  @IsObject()
  metadata?: JsonObject

  @ApiPropertyOptional({ example: '127.0.0.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string
}

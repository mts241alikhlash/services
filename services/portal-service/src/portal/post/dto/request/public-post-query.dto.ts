import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { PostType } from '../../domain/enums/post-type.enum.js'

export class PublicPostQueryDto {
  @ApiProperty({ enum: PostType })
  @IsEnum(PostType)
  type: PostType

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10

  @ApiPropertyOptional({ example: 'prestasi' })
  @IsOptional()
  @IsString()
  categorySlug?: string

  @ApiPropertyOptional({ example: 'olimpiade' })
  @IsOptional()
  @IsString()
  tagSlug?: string

  @ApiPropertyOptional({
    enum: ['active', 'archive'],
    default: 'active',
    description:
      'Pengumuman only: active hides expired notices, archive shows only those. An expired notice stays reachable at its own address either way.',
  })
  @IsOptional()
  @IsEnum(['active', 'archive'])
  scope?: 'active' | 'archive' = 'active'

  @ApiPropertyOptional({ description: 'Matches title or summary' })
  @IsOptional()
  @IsString()
  search?: string
}

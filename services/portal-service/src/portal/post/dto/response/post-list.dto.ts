import { ApiProperty } from '@nestjs/swagger'
import { PostAdminSummaryDto } from './post-admin.dto.js'
import { PostSummaryDto } from './post-detail.dto.js'

export class PostListMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number
}

export class PostAdminListResponseDto {
  @ApiProperty({ type: () => [PostAdminSummaryDto] })
  data!: PostAdminSummaryDto[]

  @ApiProperty({ type: () => PostListMetaDto })
  meta!: PostListMetaDto
}

export class PostPublicListResponseDto {
  @ApiProperty({ type: () => [PostSummaryDto] })
  data!: PostSummaryDto[]

  @ApiProperty({ type: () => PostListMetaDto })
  meta!: PostListMetaDto
}

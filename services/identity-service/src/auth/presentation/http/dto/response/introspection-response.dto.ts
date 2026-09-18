import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class IntrospectionResponseDto {
  @ApiProperty({ description: 'False for any bad, expired or revoked token' })
  active: boolean

  @ApiPropertyOptional() userId?: string
  @ApiPropertyOptional() identifier?: string
  @ApiPropertyOptional() sessionId?: string

  @ApiPropertyOptional({
    type: [String],
    description: 'Role codes, read fresh rather than echoed from the token',
  })
  roles?: string[]

  @ApiPropertyOptional({
    type: [String],
    description:
      'Permission codes. Complete — unlike the token claim, this is not dropped when it is large, because a JSON body has no header budget.',
  })
  permissions?: string[]
}

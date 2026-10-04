import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AccountLookupResponseDto {
  @ApiProperty({ example: false })
  identifierTaken!: boolean

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'The userId already holding this NIK, or null if free',
  })
  nikOwnerId!: string | null
}

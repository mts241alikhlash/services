import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AccountSummaryResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string

  @ApiProperty({ example: 'applicant@example.com' })
  identifier!: string

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  lastLoginAt!: Date | null
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AuthSessionEntity } from '../../../../../auth/domain/entities/auth-session.entity.js'

export class AuthSessionResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  userAgent?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  ipAddress?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  lastUsedAt!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: AuthSessionEntity): AuthSessionResponseDto {
    const dto = new AuthSessionResponseDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.userAgent = domain.userAgent
    dto.ipAddress = domain.ipAddress
    dto.expiresAt = domain.expiresAt.toISOString()
    dto.lastUsedAt = domain.lastUsedAt.toISOString()
    if (domain.revokedAt !== undefined)
      dto.revokedAt =
        domain.revokedAt == null
          ? domain.revokedAt
          : domain.revokedAt.toISOString()
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

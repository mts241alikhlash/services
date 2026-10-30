import { ApiProperty } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import { CAMERA_BLOCKED_REASONS } from '../../../application/use-cases/report-camera-blocked/report-camera-blocked.use-case.js'
import type { IssuedStreamToken } from '../../../application/use-cases/issue-stream-token/issue-stream-token.use-case.js'

export class StreamTokenDto {
  @ApiProperty({
    description: 'WHIP endpoint to publish to; the token is already in the URL',
  })
  publishUrl!: string

  @ApiProperty({ format: 'date-time' }) expiresAt!: string

  @ApiProperty({
    description:
      'Seconds after which the app must fetch a new token; that call is also the heartbeat',
  })
  heartbeatSeconds!: number

  static from(issued: IssuedStreamToken): StreamTokenDto {
    const dto = new StreamTokenDto()
    dto.publishUrl = issued.publishUrl
    dto.expiresAt = issued.expiresAt.toISOString()
    dto.heartbeatSeconds = issued.heartbeatSeconds
    return dto
  }
}

export class CameraBlockedDto {
  @ApiProperty({ enum: CAMERA_BLOCKED_REASONS })
  @IsIn(CAMERA_BLOCKED_REASONS)
  reason!: (typeof CAMERA_BLOCKED_REASONS)[number]
}

export class StreamAuthDto {
  @ApiProperty() token!: string
  @ApiProperty({ description: 'The stream path MediaMTX is authorising' })
  path!: string
}

export class StreamAuthResponseDto {
  @ApiProperty() ok!: boolean
}

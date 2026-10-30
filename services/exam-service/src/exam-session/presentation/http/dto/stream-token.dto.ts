import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
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

/**
 * MediaMTX's auth hook payload. It posts eleven fields and the global
 * ValidationPipe runs with `forbidNonWhitelisted`, so every field it may send has
 * to be declared here or the request is rejected before it is read.
 */
export class StreamAuthDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  user?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string

  @ApiProperty({
    required: false,
    description: 'Only set when authJWTInHTTPQuery is on',
  })
  @IsOptional()
  @IsString()
  token?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ip?: string

  @ApiProperty({
    required: false,
    enum: ['publish', 'read', 'playback', 'api', 'metrics', 'pprof'],
  })
  @IsOptional()
  @IsString()
  action?: string

  @ApiProperty({ required: false, description: 'The stream path' })
  @IsOptional()
  @IsString()
  path?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  protocol?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string

  @ApiProperty({
    required: false,
    description: 'Raw query string, e.g. token=abc',
  })
  @IsOptional()
  @IsString()
  query?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAgent?: string

  @ApiProperty({
    required: false,
    description: 'Session id of the request, when MediaMTX sends one',
  })
  @IsOptional()
  @IsString()
  uuid?: string
}

export class StreamAuthResponseDto {
  @ApiProperty({
    format: 'date-time',
    required: false,
    description:
      'When MediaMTX must close this session; omitted means no bound',
  })
  expireAt?: string
}

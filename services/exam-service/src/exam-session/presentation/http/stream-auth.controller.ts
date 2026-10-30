import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { InternalMediaGuard } from '../../../core/guards/internal-media.guard.js'
import { CheckStreamTokenUseCase } from '../../application/use-cases/check-stream-token/check-stream-token.use-case.js'
import { StreamAuthDto, StreamAuthResponseDto } from './dto/stream-token.dto.js'

/**
 * Called by MediaMTX on every publish and read attempt.
 *
 * Contract: a 2xx allows the action, anything else denies it. The body carries
 * only `expireAt`, so a denial must be a status code — answering 200 with
 * `{ok:false}` would authorise every request.
 *
 * Machine-to-machine: MediaMTX cannot send custom headers, so the shared
 * provisioning token is not usable here. `InternalMediaGuard` refuses anything
 * that came through the public gateway, and the service itself is only reachable
 * on the internal docker network. The real check is the publish token.
 */
@ApiTags('Internal')
@ApiBearerAuth()
@Public()
@UseGuards(InternalMediaGuard)
@Controller('internal/stream-auth')
export class StreamAuthController {
  constructor(private readonly checkStreamToken: CheckStreamTokenUseCase) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Whether this token may publish or read this stream path',
  })
  @ApiResponse({ status: 200, type: StreamAuthResponseDto })
  @ApiResponse({ status: 403, description: 'Denied' })
  async check(@Body() dto: StreamAuthDto): Promise<StreamAuthResponseDto> {
    // MediaMTX sends `"token": ""` when it did not lift the query token, so a
    // nullish check is not enough: an empty string has to fall through too. An SRT
    // publisher puts the session and token in `streamid=publish:<session>:<jwt>`,
    // which MediaMTX passes through the query.
    const token =
      dto.token ||
      tokenFromQuery(dto.query) ||
      tokenFromStreamId(dto.query) ||
      // MediaMTX hands an SRT `streamid`'s third segment to the hook as the bare
      // `query`, so a value that is already a JWT is the token itself.
      jwtIn(dto.query) ||
      dto.password ||
      ''
    if (!token || !dto.path) throw new ForbiddenException()

    const result = await this.checkStreamToken.execute(
      token,
      dto.path,
      dto.action ?? 'publish',
    )
    if (!result.allowed) throw new ForbiddenException()

    const response = new StreamAuthResponseDto()
    response.expireAt = result.expireAt.toISOString()
    return response
  }
}

/**
 * MediaMTX only lifts `?token=` into its own field when authJWTInHTTPQuery is on.
 * Otherwise the token is still in the raw query, so read it from there rather
 * than depending on that setting.
 */
function tokenFromQuery(query: string | undefined): string | undefined {
  if (!query) return undefined
  const value = new URLSearchParams(query).get('token')
  return value ?? undefined
}

function jwtIn(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.split('.').length === 3 ? value : undefined
}

/** SRT carries credentials as `streamid=publish:<session>:<jwt>`. */
function tokenFromStreamId(query: string | undefined): string | undefined {
  if (!query) return undefined
  const value = new URLSearchParams(query).get('streamid')
  if (!value) return undefined
  const parts = value.split(':')
  return parts.length >= 3 ? parts.slice(2).join(':') : undefined
}

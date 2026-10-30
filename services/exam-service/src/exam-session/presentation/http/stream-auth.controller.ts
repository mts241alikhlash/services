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
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { CheckStreamTokenUseCase } from '../../application/use-cases/check-stream-token/check-stream-token.use-case.js'
import { StreamAuthDto, StreamAuthResponseDto } from './dto/stream-token.dto.js'

/**
 * Called by MediaMTX on every publish and read attempt.
 *
 * Contract: a 2xx allows the action, anything else denies it. The body carries
 * only `expireAt`, so a denial must be a status code — answering 200 with
 * `{ok:false}` would authorise every request.
 *
 * Machine-to-machine: the shared provisioning token guards it, and
 * `ProvisioningTokenGuard` already refuses anything that arrived through the
 * public gateway (it rejects X-Forwarded-For).
 */
@ApiTags('Internal')
@ApiHeader({ name: 'x-provisioning-token', required: true })
@ApiBearerAuth()
@UseGuards(ProvisioningTokenGuard)
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
    const token = dto.token ?? tokenFromQuery(dto.query)
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

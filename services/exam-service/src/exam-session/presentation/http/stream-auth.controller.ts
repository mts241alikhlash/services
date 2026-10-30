import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
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
 * Called by MediaMTX on every publish attempt. Machine-to-machine: the shared
 * provisioning token guards it, and `ProvisioningTokenGuard` already refuses
 * anything that arrived through the public gateway (it rejects X-Forwarded-For).
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
    summary: 'Whether this publish token may open this stream path',
  })
  @ApiResponse({ status: 200, type: StreamAuthResponseDto })
  async check(@Body() dto: StreamAuthDto): Promise<StreamAuthResponseDto> {
    const result = new StreamAuthResponseDto()
    result.ok = await this.checkStreamToken.execute(dto.token, dto.path)
    return result
  }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { Public } from '../../../core/decorators/public.decorator.js'
import { NativeLoginUseCase } from '../../application/use-cases/native-auth/native-login.use-case.js'
import { NativeLogoutUseCase } from '../../application/use-cases/native-auth/native-logout.use-case.js'
import { NativeRefreshUseCase } from '../../application/use-cases/native-auth/native-refresh.use-case.js'
import {
  NativeLoginDto,
  NativeLogoutDto,
  NativeRefreshDto,
} from './dto/request/native-auth.dto.js'
import { NativeAuthResponseDto } from './dto/response/native-auth-response.dto.js'

@ApiTags('Native authentication')
@Public()
@Controller('auth/native')
export class NativeAuthController {
  constructor(
    private readonly loginUseCase: NativeLoginUseCase,
    private readonly refreshUseCase: NativeRefreshUseCase,
    private readonly logoutUseCase: NativeLogoutUseCase,
  ) {}

  @Throttle({ auth: {} })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in from the exam app with tokens in the body, no cookies',
  })
  @ApiResponse({ status: 200, type: NativeAuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Not a student or teacher account' })
  async login(
    @Body() dto: NativeLoginDto,
    @Req() req: Request,
  ): Promise<NativeAuthResponseDto> {
    return NativeAuthResponseDto.fromDomain(
      await this.loginUseCase.execute(dto, req.ip ?? req.socket.remoteAddress),
    )
  }

  @Throttle({ auth: {} })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token from the same tablet' })
  @ApiResponse({ status: 200, type: NativeAuthResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Invalid, revoked or foreign session',
  })
  async refresh(@Body() dto: NativeRefreshDto): Promise<NativeAuthResponseDto> {
    return NativeAuthResponseDto.fromDomain(
      await this.refreshUseCase.execute(dto),
    )
  }

  @Throttle({ auth: {} })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the session of a refresh token' })
  @ApiResponse({ status: 204 })
  async logout(@Body() dto: NativeLogoutDto): Promise<void> {
    await this.logoutUseCase.execute(dto)
  }
}

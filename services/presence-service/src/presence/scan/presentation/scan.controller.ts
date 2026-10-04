import {
  BatchScanResultResponseDto,
  ClockAnchorResponseDto,
  ScanListResponseDto,
  ScanResultResponseDto,
} from '../dto/response/scan-response.dto.js'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { CookieOptions, Response } from 'express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { PaginatedResponse } from '../../../shared/domain/interfaces/repository.interface.js'
import {
  DEVICE_TOKEN_COOKIE,
  PRESENCE_DEVICE_REQUEST_KEY,
} from '../../shared/constants/presence.constants.js'
import { DeviceAuth } from '../../shared/decorators/device-auth.decorator.js'
import { bearerToken, DeviceGuard } from '../../shared/guards/device.guard.js'
import type { ClockAnchor } from '../../shared/services/server-clock.service.js'
import { BatchScanResult, ScanResult } from '../domain/entities/scan.entity.js'
import { ScanWithDevice } from '../domain/interfaces/scan-repository.interface.js'
import { RecordScanBatchDto } from '../dto/request/record-scan-batch.dto.js'
import { RecordScanDto } from '../dto/request/record-scan.dto.js'
import { ScanQueryDto } from '../dto/request/scan-query.dto.js'
import {
  GetClockAnchorUseCase,
  GetScansUseCase,
} from '../use-cases/get-scans.use-case.js'
import { RecordScanBatchUseCase } from '../use-cases/record-scan-batch.use-case.js'
import { RecordScanUseCase } from '../use-cases/record-scan.use-case.js'

interface DeviceRequest {
  [PRESENCE_DEVICE_REQUEST_KEY]: { id: string }
}

@ApiTags('Presence — Scans')
@Controller('presence/scans')
export class ScanController {
  constructor(
    private readonly recordScan: RecordScanUseCase,
    private readonly recordBatch: RecordScanBatchUseCase,
    private readonly getAnchor: GetClockAnchorUseCase,
    private readonly getAll: GetScansUseCase,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/presence/scans',
    }
  }

  @Post('pair')
  @DeviceAuth()
  @UseGuards(DeviceGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Keep a gate device token in an HttpOnly cookie on this browser',
  })
  pair(
    @Req() request: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true }) res: Response,
  ): void {
    const token = bearerToken(request)
    if (!token) return
    res.cookie(DEVICE_TOKEN_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: 400 * 24 * 60 * 60 * 1000,
    })
  }

  @Post('unpair')
  @DeviceAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Forget the gate device paired on this browser' })
  unpair(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(DEVICE_TOKEN_COOKIE, this.cookieOptions())
  }

  @Post()
  @DeviceAuth()
  @UseGuards(DeviceGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record one scan from a gate device' })
  async scan(
    @Req() request: DeviceRequest,
    @Body() dto: RecordScanDto,
  ): Promise<ScanResultResponseDto> {
    return ScanResultResponseDto.fromDomain(
      await this.recordScan.execute(
        request[PRESENCE_DEVICE_REQUEST_KEY].id,
        dto,
      ),
    )
  }

  @Post('batch')
  @DeviceAuth()
  @UseGuards(DeviceGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Flush scans queued while the device was offline' })
  async batch(
    @Req() request: DeviceRequest,
    @Body() dto: RecordScanBatchDto,
  ): Promise<BatchScanResultResponseDto[]> {
    return (
      await this.recordBatch.execute(
        request[PRESENCE_DEVICE_REQUEST_KEY].id,
        dto,
      )
    ).map((item) => BatchScanResultResponseDto.fromDomain(item))
  }

  @Get('clock')
  @DeviceAuth()
  @UseGuards(DeviceGuard)
  @ApiOperation({ summary: 'The anchor a device pins its monotonic clock to' })
  clock(): Promise<ClockAnchorResponseDto> {
    return Promise.resolve(
      ClockAnchorResponseDto.fromDomain(this.getAnchor.execute()),
    )
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('presence-scans.read')
  @ApiOperation({ summary: 'The scan log, including rejected attempts' })
  async list(@Query() query: ScanQueryDto): Promise<ScanListResponseDto> {
    return ScanListResponseDto.fromDomain(await this.getAll.execute(query))
  }
}

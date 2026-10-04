import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'

import { GetAcademicSettingUseCase } from '../../application/use-cases/get-academic-setting/get-academic-setting.use-case.js'
import { UpdateAcademicSettingUseCase } from '../../application/use-cases/update-academic-setting/update-academic-setting.use-case.js'
import { UpdateAcademicSettingDto } from './dto/request/update-academic-setting.dto.js'
import { AcademicSettingResponseDto } from './dto/response/academic-setting-response.dto.js'

@ApiTags('Academic Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academic-settings')
export class AcademicSettingController {
  constructor(
    private readonly getAcademicSetting: GetAcademicSettingUseCase,
    private readonly updateAcademicSetting: UpdateAcademicSettingUseCase,
  ) {}

  @Get()
  @RequirePermissions('academic-settings.read')
  @ApiOperation({ summary: 'Get school-wide academic settings' })
  @ApiResponse({ status: 200, type: AcademicSettingResponseDto })
  async get(): Promise<AcademicSettingResponseDto> {
    const setting = await this.getAcademicSetting.execute()
    return AcademicSettingResponseDto.fromDomain(setting)
  }

  @Patch()
  @RequirePermissions('academic-settings.update')
  @ApiOperation({ summary: 'Update school-wide academic settings' })
  @ApiResponse({ status: 200, type: AcademicSettingResponseDto })
  async update(
    @Body() dto: UpdateAcademicSettingDto,
  ): Promise<AcademicSettingResponseDto> {
    const setting = await this.updateAcademicSetting.execute({
      weeklyHolidays: dto.weeklyHolidays,
      defaultPassingScore: dto.defaultPassingScore,
    })
    return AcademicSettingResponseDto.fromDomain(setting)
  }
}

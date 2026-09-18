import { Controller, Get, UseGuards } from '@nestjs/common'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IAcademicSettingRepository } from '../../domain/repositories/academic-setting.repository.js'

export class AcademicSettingSummaryDto {
  @ApiProperty({
    description:
      'School-wide fallback used when a curriculum sets no passing score.',
    example: 75,
    nullable: true,
  })
  defaultPassingScore!: number | null

  @ApiProperty({
    type: [Number],
    description: 'Weekday numbers the school does not teach on (0 = Sunday).',
    example: [0, 6],
  })
  weeklyHolidays!: number[]
}

export class AcademicSettingSummaryResponseDto {
  @ApiProperty({ type: AcademicSettingSummaryDto, nullable: true })
  data!: AcademicSettingSummaryDto | null
}

@ApiTags('Academic Settings')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('academic-settings')
export class AcademicSettingInternalController {
  constructor(
    private readonly academicSettingRepository: IAcademicSettingRepository,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'School-wide academic settings other services read',
  })
  @ApiResponse({ status: 200, type: AcademicSettingSummaryResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async summary(): Promise<AcademicSettingSummaryResponseDto> {
    const setting = await this.academicSettingRepository.find()
    if (!setting) return { data: null }
    return {
      data: {
        defaultPassingScore: setting.defaultPassingScore,
        weeklyHolidays: setting.weeklyHolidays,
      },
    }
  }
}

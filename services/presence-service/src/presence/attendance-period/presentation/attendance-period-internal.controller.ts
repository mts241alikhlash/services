import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IAttendancePeriodRepository } from '../domain/interfaces/attendance-period-repository.interface.js'

export class AttendancePeriodClosedDto {
  @ApiProperty({
    description:
      'Whether the month is closed. Payroll refuses to run against an open month, because a scan recorded afterwards would change a payslip already issued.',
  })
  closed!: boolean
}

export class AttendancePeriodClosedResponseDto {
  @ApiProperty({ type: AttendancePeriodClosedDto })
  data!: AttendancePeriodClosedDto
}

@ApiTags('Attendance Periods')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('presence/periods')
export class AttendancePeriodInternalController {
  constructor(private readonly periods: IAttendancePeriodRepository) {}

  @Get(':year/:month/closed')
  @ApiOperation({ summary: 'Whether an attendance month is closed' })
  @ApiResponse({ status: 200, type: AttendancePeriodClosedResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async isClosed(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ): Promise<AttendancePeriodClosedResponseDto> {
    return { data: { closed: await this.periods.isClosed(year, month) } }
  }
}

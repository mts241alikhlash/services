import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsInt,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IDailyPresenceReadPort } from '../domain/interfaces/daily-presence-read.port.js'

export class GateSuggestionQueryDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('4', { each: true })
  userIds!: string[]

  @ApiProperty({ type: Date })
  @Type(() => Date)
  @IsDate()
  date!: Date
}

export class MonthlySummaryQueryDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('4', { each: true })
  userIds!: string[]

  @ApiProperty()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number
}

export class GateSuggestionDto {
  @ApiProperty() userId!: string
  @ApiProperty() status!: string
  @ApiProperty({ nullable: true }) checkInAt!: Date | null
  @ApiProperty() lateMinutes!: number
}

export class GateSuggestionListResponseDto {
  @ApiProperty({ type: [GateSuggestionDto] })
  data!: GateSuggestionDto[]
}

export class MonthlyPresenceSummaryDto {
  @ApiProperty() userId!: string
  @ApiProperty() presentDays!: number
  @ApiProperty() absentDays!: number
  @ApiProperty() lateCount!: number
  @ApiProperty() lateMinutes!: number
  @ApiProperty() earlyLeaveCount!: number
  @ApiProperty() leaveDays!: number
  @ApiProperty() officialDutyDays!: number
}

export class MonthlyPresenceSummaryListResponseDto {
  @ApiProperty({ type: [MonthlyPresenceSummaryDto] })
  data!: MonthlyPresenceSummaryDto[]
}

@ApiTags('Daily Presences')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('daily-presences')
export class DailyRecordInternalController {
  constructor(private readonly readPort: IDailyPresenceReadPort) {}

  @Post('by-users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "One day's gate record for a batch of accounts",
    description:
      'Pre-fills a class attendance sheet from the gate. Accounts with no ' +
      'record that day are absent from the response rather than defaulted.',
  })
  @ApiResponse({ status: 200, type: GateSuggestionListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async byUsers(
    @Body() dto: GateSuggestionQueryDto,
  ): Promise<GateSuggestionListResponseDto> {
    return {
      data: await this.readPort.findByUsersAndDate(dto.userIds, dto.date),
    }
  }

  @Post('monthly-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "One month's gate totals for a batch of accounts",
    description:
      'Every account asked for appears, including one with no record at all ' +
      '— a defensible figure for someone on long leave, not a silent omission.',
  })
  @ApiResponse({ status: 200, type: MonthlyPresenceSummaryListResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async monthlySummary(
    @Body() dto: MonthlySummaryQueryDto,
  ): Promise<MonthlyPresenceSummaryListResponseDto> {
    return {
      data: await this.readPort.summariseMonth(
        dto.userIds,
        dto.year,
        dto.month,
      ),
    }
  }
}

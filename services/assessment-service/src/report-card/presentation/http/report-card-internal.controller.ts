import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { IReportCardRepository } from '../../domain/repositories/report-card.repository.js'

export class EnrollmentIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID('4', { each: true })
  enrollmentIds!: string[]
}

export class ReportCardAverageDto {
  @ApiProperty() enrollmentId!: string

  @ApiProperty({
    nullable: true,
    description: 'null when the card exists but has no scored subjects yet',
  })
  totalAverage!: number | null
}

export class ReportCardAveragesResponseDto {
  @ApiProperty({ type: [ReportCardAverageDto] })
  data!: ReportCardAverageDto[]
}

@ApiTags('Report Cards')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('report-cards')
export class ReportCardInternalController {
  constructor(private readonly reportCardRepository: IReportCardRepository) {}

  @Post('averages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report-card averages for a batch of enrolments',
    description:
      'Read by student-service on the promotion screen, which colours each ' +
      'row by whether the average clears the passing score. Enrolments with ' +
      'no report card are simply absent from the response.',
  })
  @ApiResponse({ status: 200, type: ReportCardAveragesResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async averages(
    @Body() dto: EnrollmentIdsDto,
  ): Promise<ReportCardAveragesResponseDto> {
    return {
      data: await this.reportCardRepository.findAveragesByEnrollmentIds(
        dto.enrollmentIds,
      ),
    }
  }
}

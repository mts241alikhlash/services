import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { RolloverSemesterDto } from './dto/request/rollover-semester.dto.js'
import { RolloverSummaryDto } from './dto/response/rollover-summary.dto.js'
import { RolloverSemesterUseCase } from '../../application/use-cases/rollover-semester/rollover-semester.use-case.js'

@ApiTags('Semesters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('semester-rollovers')
export class SemesterRolloverController {
  constructor(
    private readonly rolloverSemesterService: RolloverSemesterUseCase,
  ) {}

  @Post()
  @RequirePermissions('semesters.create')
  @ApiOperation({
    summary:
      'Rollover semester data (classrooms, enrollments, etc.) from source to target semester',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollover summary with created/skipped counts',
    type: RolloverSummaryDto,
  })
  @ApiResponse({ status: 400, description: 'Source and target must differ' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  async rollover(
    @Body() dto: RolloverSemesterDto,
  ): Promise<RolloverSummaryDto> {
    const result = await this.rolloverSemesterService.execute({
      sourceSemesterId: dto.sourceSemesterId,
      targetSemesterId: dto.targetSemesterId,
    })
    return RolloverSummaryDto.fromResult(result)
  }
}

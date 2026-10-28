import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { PaginationQueryDto } from '../../../shared/dto/pagination.dto.js'
import { ListScheduleSessionsUseCase } from '../../application/use-cases/list-schedule-sessions/list-schedule-sessions.use-case.js'
import { ReleaseSessionUseCase } from '../../application/use-cases/release-session/release-session.use-case.js'
import {
  ScheduleSessionDto,
  ScheduleSessionListResponseDto,
} from './dto/schedule-session.dto.js'

@ApiTags('Exam Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ExamSessionAdminController {
  constructor(
    private readonly listSessions: ListScheduleSessionsUseCase,
    private readonly releaseSession: ReleaseSessionUseCase,
  ) {}

  @Get('exam-schedules/:id/sessions')
  @RequirePermissions('exam-sessions.read')
  @ApiOperation({ summary: 'The sessions students started for a schedule' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ScheduleSessionListResponseDto })
  async findBySchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ScheduleSessionListResponseDto> {
    return ScheduleSessionListResponseDto.fromDomain(
      await this.listSessions.execute(id, query.page, query.limit),
    )
  }

  @Post('exam-sessions/:id/release')
  @RequirePermissions('exam-sessions.release')
  @ApiOperation({
    summary:
      'Free the device of a session so the student can continue elsewhere',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, type: ScheduleSessionDto })
  async release(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduleSessionDto> {
    return ScheduleSessionDto.fromDomain(
      await this.releaseSession.execute(user, id),
    )
  }
}

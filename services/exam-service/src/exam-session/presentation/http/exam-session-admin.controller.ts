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
import { ListScheduleStreamsUseCase } from '../../application/use-cases/list-schedule-streams/list-schedule-streams.use-case.js'
import {
  ScheduleSessionDto,
  ScheduleSessionListResponseDto,
} from './dto/schedule-session.dto.js'
import { ScheduleStreamListResponseDto } from './dto/schedule-stream.dto.js'

@ApiTags('Exam Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ExamSessionAdminController {
  constructor(
    private readonly listSessions: ListScheduleSessionsUseCase,
    private readonly releaseSession: ReleaseSessionUseCase,
    private readonly listStreams: ListScheduleStreamsUseCase,
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

  @Get('exam-schedules/:id/streams')
  @RequirePermissions('exam-sessions.read')
  @ApiOperation({
    summary:
      'Per-session camera stream status for the supervisor grid of a schedule',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ScheduleStreamListResponseDto })
  async streams(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScheduleStreamListResponseDto> {
    return ScheduleStreamListResponseDto.fromDomain(
      await this.listStreams.execute(id, new Date()),
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

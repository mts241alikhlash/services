import {
  Controller,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import type { GradingUser } from '../../application/grading-scope.service.js'
import { GetGradingSessionUseCase } from '../../application/use-cases/get-grading-session/get-grading-session.use-case.js'
import { GradeAnswerUseCase } from '../../application/use-cases/grade-answer/grade-answer.use-case.js'
import { ListGradingSchedulesUseCase } from '../../application/use-cases/list-grading-schedules/list-grading-schedules.use-case.js'
import { ListGradingSessionsUseCase } from '../../application/use-cases/list-grading-sessions/list-grading-sessions.use-case.js'
import {
  GradeAnswerDto,
  GradingScheduleQueryDto,
  GradingSessionQueryDto,
} from './dto/grading-request.dto.js'
import {
  GradingItemDto,
  GradingScheduleListResponseDto,
  GradingSessionDetailDto,
  GradingSessionListResponseDto,
} from './dto/grading-response.dto.js'

@ApiTags('Exam Grading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-grading')
export class ExamGradingController {
  constructor(
    private readonly listSchedules: ListGradingSchedulesUseCase,
    private readonly listSessions: ListGradingSessionsUseCase,
    private readonly getSession: GetGradingSessionUseCase,
    private readonly gradeAnswer: GradeAnswerUseCase,
  ) {}

  @Get('schedules')
  @RequirePermissions('exam-grading.read')
  @ApiOperation({
    summary: 'The exams the caller may grade, with grading counts',
  })
  @ApiResponse({ status: 200, type: GradingScheduleListResponseDto })
  async schedules(
    @CurrentUser() user: GradingUser,
    @Query() query: GradingScheduleQueryDto,
  ): Promise<GradingScheduleListResponseDto> {
    return GradingScheduleListResponseDto.fromDomain(
      await this.listSchedules.execute(user, {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        semesterId: query.semesterId,
      }),
    )
  }

  @Get('schedules/:scheduleId/sessions')
  @RequirePermissions('exam-grading.read')
  @ApiOperation({
    summary: 'The sessions of one exam with their grading state',
  })
  @ApiParam({ name: 'scheduleId', format: 'uuid' })
  @ApiResponse({ status: 200, type: GradingSessionListResponseDto })
  async sessions(
    @CurrentUser() user: GradingUser,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Query() query: GradingSessionQueryDto,
  ): Promise<GradingSessionListResponseDto> {
    return GradingSessionListResponseDto.fromDomain(
      await this.listSessions.execute(user, scheduleId, {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        status: query.status,
      }),
    )
  }

  @Get('sessions/:sessionId')
  @RequirePermissions('exam-grading.read')
  @ApiOperation({
    summary: 'The short answers and essays of a session to grade',
  })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiResponse({ status: 200, type: GradingSessionDetailDto })
  async session(
    @CurrentUser() user: GradingUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<GradingSessionDetailDto> {
    return GradingSessionDetailDto.fromDomain(
      await this.getSession.execute(user, sessionId),
    )
  }

  @Patch('sessions/:sessionId/answers/:questionId')
  @RequirePermissions('exam-grading.grade')
  @ApiOperation({ summary: 'Grade one short answer or essay' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiResponse({ status: 200, type: GradingItemDto })
  async grade(
    @CurrentUser() user: GradingUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: GradeAnswerDto,
  ): Promise<GradingItemDto> {
    return GradingItemDto.fromDomain(
      await this.gradeAnswer.execute(user, sessionId, questionId, dto),
    )
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
import { ListMyExamsUseCase } from '../../application/use-cases/list-my-exams/list-my-exams.use-case.js'
import { StartExamSessionUseCase } from '../../application/use-cases/start-exam-session/start-exam-session.use-case.js'
import { StartedSessionDto, StartSessionDto } from './dto/start-session.dto.js'
import { MyExamDto } from './dto/student-exam-response.dto.js'

@ApiTags('Student Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/exams')
export class StudentExamController {
  constructor(
    private readonly listMyExams: ListMyExamsUseCase,
    private readonly startSession: StartExamSessionUseCase,
  ) {}

  @Get()
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({ summary: 'The exams of the classroom the student is in' })
  @ApiResponse({ status: 200, type: [MyExamDto] })
  async findMine(@CurrentUser() user: { id: string }): Promise<MyExamDto[]> {
    return (await this.listMyExams.execute(user)).map((exam) =>
      MyExamDto.fromDomain(exam),
    )
  }

  @Post(':scheduleId/sessions')
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({
    summary:
      'Start the exam, or continue it on the same device, with the access code',
  })
  @ApiResponse({ status: 201, type: StartedSessionDto })
  @ApiParam({ name: 'scheduleId', format: 'uuid' })
  async start(
    @CurrentUser() user: { id: string },
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: StartSessionDto,
  ): Promise<StartedSessionDto> {
    return StartedSessionDto.fromDomain(
      await this.startSession.execute(user, scheduleId, dto),
    )
  }
}

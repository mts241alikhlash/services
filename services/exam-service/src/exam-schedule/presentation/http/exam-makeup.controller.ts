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
import { CreateMakeupUseCase } from '../../application/use-cases/create-makeup/create-makeup.use-case.js'
import { ListAbsenteesUseCase } from '../../application/use-cases/list-absentees/list-absentees.use-case.js'
import { CreateMakeupDto } from './dto/request/makeup-request.dto.js'
import { AbsenteeDto } from './dto/response/absentee-response.dto.js'
import { ExamScheduleDto } from './dto/response/exam-schedule-response.dto.js'

@ApiTags('Exam Makeups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-schedules')
export class ExamMakeupController {
  constructor(
    private readonly listAbsentees: ListAbsenteesUseCase,
    private readonly createMakeup: CreateMakeupUseCase,
  ) {}

  @Get(':id/absentees')
  @RequirePermissions('exam-schedules.read')
  @ApiOperation({
    summary: 'The students of the classroom who can still sit a makeup',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: [AbsenteeDto] })
  async absentees(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AbsenteeDto[]> {
    return (await this.listAbsentees.execute(id)).map((row) =>
      AbsenteeDto.fromDomain(row),
    )
  }

  @Post(':id/makeups')
  @RequirePermissions('exam-schedules.create')
  @ApiOperation({
    summary: 'Create a makeup of an exam for students who did not sit it',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 201, type: ExamScheduleDto })
  async makeup(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMakeupDto,
  ): Promise<ExamScheduleDto> {
    return ExamScheduleDto.fromDomain(
      await this.createMakeup.execute(user, id, {
        packageId: dto.packageId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        durationMinutes: dto.durationMinutes,
        participants: dto.participants.map((participant) => ({
          studentId: participant.studentId,
          reason: participant.reason,
          note: participant.note ?? null,
        })),
      }),
    )
  }
}

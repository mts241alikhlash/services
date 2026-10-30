import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { AddMakeupParticipantsUseCase } from '../../application/use-cases/makeup-participants/add-makeup-participants.use-case.js'
import { GetMakeupParticipantsUseCase } from '../../application/use-cases/makeup-participants/get-makeup-participants.use-case.js'
import { RemoveMakeupParticipantUseCase } from '../../application/use-cases/makeup-participants/remove-makeup-participant.use-case.js'
import { CreateMakeupUseCase } from '../../application/use-cases/create-makeup/create-makeup.use-case.js'
import { ListAbsenteesUseCase } from '../../application/use-cases/list-absentees/list-absentees.use-case.js'
import {
  AddParticipantsDto,
  CreateMakeupDto,
} from './dto/request/makeup-request.dto.js'
import { AbsenteeDto } from './dto/response/absentee-response.dto.js'
import { ParticipantDto } from './dto/response/participant-response.dto.js'
import { ExamScheduleDto } from './dto/response/exam-schedule-response.dto.js'

@ApiTags('Exam Makeups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-schedules')
export class ExamMakeupController {
  constructor(
    private readonly listAbsentees: ListAbsenteesUseCase,
    private readonly createMakeup: CreateMakeupUseCase,
    private readonly addParticipants: AddMakeupParticipantsUseCase,
    private readonly removeParticipant: RemoveMakeupParticipantUseCase,
    private readonly getParticipants: GetMakeupParticipantsUseCase,
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

  @Get(':id/participants')
  @RequirePermissions('exam-schedules.read')
  @ApiOperation({ summary: 'The students on a makeup, with live status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ParticipantDto] })
  async participants(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantDto[]> {
    return (await this.getParticipants.execute(id)).map((row) =>
      ParticipantDto.fromDomain(row),
    )
  }

  @Post(':id/participants')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('exam-schedules.create')
  @ApiOperation({ summary: 'Add students to a makeup' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204 })
  async addToMakeup(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddParticipantsDto,
  ): Promise<void> {
    await this.addParticipants.execute(
      user,
      id,
      dto.participants.map((participant) => ({
        studentId: participant.studentId,
        reason: participant.reason,
        note: participant.note ?? null,
      })),
    )
  }

  @Delete(':id/participants/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('exam-schedules.create')
  @ApiOperation({ summary: 'Remove a student who has not started the makeup' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'studentId', format: 'uuid' })
  @ApiResponse({ status: 204 })
  async removeFromMakeup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<void> {
    await this.removeParticipant.execute(id, studentId)
  }
}

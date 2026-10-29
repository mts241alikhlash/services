import {
  Controller,
  Body,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { Response } from 'express'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { GetPaperUseCase } from '../../application/use-cases/get-paper/get-paper.use-case.js'
import { GetSessionFileUseCase } from '../../application/use-cases/get-session-file/get-session-file.use-case.js'
import { RecordViolationsUseCase } from '../../application/use-cases/record-violations/record-violations.use-case.js'
import { SubmitExamSessionUseCase } from '../../application/use-cases/submit-exam-session/submit-exam-session.use-case.js'
import { SaveAnswerUseCase } from '../../application/use-cases/save-answer/save-answer.use-case.js'
import { ListSavedAnswersUseCase } from '../../application/use-cases/list-saved-answers/list-saved-answers.use-case.js'
import { DeviceId } from './device-id.decorator.js'
import { PaperQuestionDto, SavedAnswerDto } from './dto/paper-question.dto.js'
import { SaveAnswerDto, SavedAnswerAckDto } from './dto/save-answer.dto.js'
import {
  RecordViolationsRequestDto,
  ViolationCountDto,
} from './dto/record-violations.dto.js'
import {
  SubmitSessionRequestDto,
  SubmittedSessionDto,
} from './dto/submit-session.dto.js'

@ApiTags('Student Exams')
@ApiHeader({
  name: 'X-Device-Id',
  required: true,
  description: 'The tablet the session was started on',
})
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('student-exams/:sessionId')
export class SessionExamController {
  constructor(
    private readonly getPaper: GetPaperUseCase,
    private readonly getFile: GetSessionFileUseCase,
    private readonly listAnswers: ListSavedAnswersUseCase,
    private readonly saveAnswer: SaveAnswerUseCase,
    private readonly submitSession: SubmitExamSessionUseCase,
    private readonly recordViolations: RecordViolationsUseCase,
  ) {}

  @Get('questions')
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({ summary: 'The shuffled paper of this session, without keys' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PaperQuestionDto] })
  async questions(
    @CurrentUser() user: { id: string },
    @DeviceId() deviceId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<PaperQuestionDto[]> {
    return (
      await this.getPaper.execute({ id: user.id, deviceId }, sessionId)
    ).map((question) => PaperQuestionDto.fromDomain(question))
  }

  @Get('answers')
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({ summary: 'The answers saved so far' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [SavedAnswerDto] })
  async answers(
    @CurrentUser() user: { id: string },
    @DeviceId() deviceId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<SavedAnswerDto[]> {
    return (
      await this.listAnswers.execute({ id: user.id, deviceId }, sessionId)
    ).map((answer) => SavedAnswerDto.fromDomain(answer))
  }

  @Post('answers')
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({
    summary: 'Save one answer; replaying a client id is a no-op',
  })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiResponse({ status: 201, type: SavedAnswerAckDto })
  async save(
    @CurrentUser() user: { id: string },
    @DeviceId() deviceId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SaveAnswerDto,
  ): Promise<SavedAnswerAckDto> {
    return SavedAnswerAckDto.fromDomain(
      await this.saveAnswer.execute({ id: user.id, deviceId }, sessionId, dto),
    )
  }

  @Post('violations')
  @HttpCode(200)
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({
    summary:
      'Tell the server how many times the student left the exam; it keeps the highest count and answers with it',
  })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ViolationCountDto })
  async violations(
    @CurrentUser() user: { id: string },
    @DeviceId() deviceId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: RecordViolationsRequestDto,
  ): Promise<ViolationCountDto> {
    return ViolationCountDto.of(
      await this.recordViolations.execute(
        { id: user.id, deviceId },
        sessionId,
        body.count,
      ),
    )
  }

  @Post('submit')
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({ summary: 'Hand in the exam; repeating it changes nothing' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiResponse({ status: 201, type: SubmittedSessionDto })
  async submit(
    @CurrentUser() user: { id: string },
    @DeviceId() deviceId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: SubmitSessionRequestDto,
  ): Promise<SubmittedSessionDto> {
    return SubmittedSessionDto.fromDomain(
      await this.submitSession.execute(
        { id: user.id, deviceId },
        sessionId,
        new Date(),
        body?.violations ?? 0,
      ),
    )
  }

  @Get('files/:fileId')
  @RequirePermissions('exam-sessions.take')
  @ApiOperation({
    summary: 'Stream an image used by the paper of this session',
  })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'The image bytes',
    content: { 'image/png': { schema: { type: 'string', format: 'binary' } } },
  })
  async file(
    @CurrentUser() user: { id: string },
    @DeviceId() deviceId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { file, stream } = await this.getFile.execute(
      { id: user.id, deviceId },
      sessionId,
      fileId,
    )
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.sizeBytes),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=86400',
    })
    return new StreamableFile(stream)
  }
}

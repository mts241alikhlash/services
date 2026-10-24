import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { ApproveManyQuestionsUseCase } from '../../application/use-cases/approve-many-questions/approve-many-questions.use-case.js'
import { ApproveQuestionUseCase } from '../../application/use-cases/approve-question/approve-question.use-case.js'
import { ReturnQuestionUseCase } from '../../application/use-cases/return-question/return-question.use-case.js'
import { SubmitQuestionUseCase } from '../../application/use-cases/submit-question/submit-question.use-case.js'
import { CreateQuestionUseCase } from '../../application/use-cases/create-question/create-question.use-case.js'
import { DeleteQuestionUseCase } from '../../application/use-cases/delete-question/delete-question.use-case.js'
import { GetQuestionUseCase } from '../../application/use-cases/get-question/get-question.use-case.js'
import { GetQuestionScopeUseCase } from '../../application/use-cases/get-question-scope/get-question-scope.use-case.js'
import { GetQuestionVersionsUseCase } from '../../application/use-cases/get-question-versions/get-question-versions.use-case.js'
import { ListQuestionsUseCase } from '../../application/use-cases/list-questions/list-questions.use-case.js'
import { UpdateQuestionUseCase } from '../../application/use-cases/update-question/update-question.use-case.js'
import type { ScopeUser } from '../../application/teacher-scope.service.js'
import { CreateQuestionDto } from './dto/request/create-question.dto.js'
import { ApproveManyDto } from './dto/request/approve-many.dto.js'
import { ApproveQuestionDto } from './dto/request/approve-question.dto.js'
import { ReturnQuestionDto } from './dto/request/return-question.dto.js'
import { QuestionQueryDto } from './dto/request/question-query.dto.js'
import { UpdateQuestionDto } from './dto/request/update-question.dto.js'
import {
  ApproveManyResponseDto,
  QuestionDetailDto,
  QuestionListResponseDto,
  QuestionScopeDto,
  QuestionVersionDto,
} from './dto/response/question-response.dto.js'

@ApiTags('Exam Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-questions')
export class QuestionController {
  constructor(
    private readonly listQuestions: ListQuestionsUseCase,
    private readonly getQuestion: GetQuestionUseCase,
    private readonly getVersions: GetQuestionVersionsUseCase,
    private readonly createQuestion: CreateQuestionUseCase,
    private readonly updateQuestion: UpdateQuestionUseCase,
    private readonly deleteQuestion: DeleteQuestionUseCase,
    private readonly submitQuestion: SubmitQuestionUseCase,
    private readonly approveQuestion: ApproveQuestionUseCase,
    private readonly returnQuestion: ReturnQuestionUseCase,
    private readonly approveMany: ApproveManyQuestionsUseCase,
    private readonly getScope: GetQuestionScopeUseCase,
  ) {}

  @Get()
  @RequirePermissions('exam-questions.read')
  @ApiOperation({ summary: 'List questions in the teacher scope' })
  @ApiResponse({ status: 200, type: QuestionListResponseDto })
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query() query: QuestionQueryDto,
  ): Promise<QuestionListResponseDto> {
    return QuestionListResponseDto.fromDomain(
      await this.listQuestions.execute(user, query),
    )
  }

  @Get('scope')
  @RequirePermissions('exam-questions.read')
  @ApiOperation({ summary: 'Subjects and grades the signed-in user may use' })
  @ApiResponse({ status: 200, type: QuestionScopeDto })
  async scope(@CurrentUser() user: ScopeUser): Promise<QuestionScopeDto> {
    return QuestionScopeDto.fromDomain(await this.getScope.execute(user))
  }

  @Get(':id')
  @RequirePermissions('exam-questions.read')
  @ApiOperation({ summary: 'Get a question with its current version' })
  @ApiResponse({ status: 200, type: QuestionDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuestionDetailDto> {
    return QuestionDetailDto.fromDomain(
      await this.getQuestion.execute(user, id),
    )
  }

  @Get(':id/versions')
  @RequirePermissions('exam-questions.read')
  @ApiOperation({ summary: 'List every version of a question' })
  @ApiResponse({ status: 200, type: [QuestionVersionDto] })
  @ApiParam({ name: 'id', format: 'uuid' })
  async versions(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuestionVersionDto[]> {
    const versions = await this.getVersions.execute(user, id)
    return versions.map((version) => QuestionVersionDto.fromDomain(version))
  }

  @Post()
  @RequirePermissions('exam-questions.create')
  @ApiOperation({ summary: 'Create a draft question' })
  @ApiResponse({ status: 201, type: QuestionDetailDto })
  async create(
    @CurrentUser() user: ScopeUser,
    @Body() dto: CreateQuestionDto,
  ): Promise<QuestionDetailDto> {
    return QuestionDetailDto.fromDomain(
      await this.createQuestion.execute(user, dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('exam-questions.update')
  @ApiOperation({
    summary: 'Edit a question, or write a new version of an approved one',
  })
  @ApiResponse({ status: 200, type: QuestionDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async update(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<QuestionDetailDto> {
    return QuestionDetailDto.fromDomain(
      await this.updateQuestion.execute(user, id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('exam-questions.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question that was never approved' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteQuestion.execute(user, id)
  }

  @Post('approve-many')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-questions.approve')
  @ApiOperation({ summary: 'Approve several submitted questions at once' })
  @ApiResponse({ status: 200, type: ApproveManyResponseDto })
  async approveManyQuestions(
    @CurrentUser() user: ScopeUser,
    @Body() dto: ApproveManyDto,
  ): Promise<ApproveManyResponseDto> {
    return ApproveManyResponseDto.fromDomain(
      await this.approveMany.execute(user, dto.items),
    )
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-questions.update')
  @ApiOperation({ summary: 'Submit a question for approval' })
  @ApiResponse({ status: 200, type: QuestionDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async submit(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuestionDetailDto> {
    return QuestionDetailDto.fromDomain(
      await this.submitQuestion.execute(user, id),
    )
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-questions.approve')
  @ApiOperation({ summary: 'Approve a submitted question' })
  @ApiResponse({ status: 200, type: QuestionDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async approve(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveQuestionDto,
  ): Promise<QuestionDetailDto> {
    return QuestionDetailDto.fromDomain(
      await this.approveQuestion.execute(user, id, dto.revision),
    )
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-questions.approve')
  @ApiOperation({ summary: 'Return a submitted question with a note' })
  @ApiResponse({ status: 200, type: QuestionDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async returnToAuthor(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnQuestionDto,
  ): Promise<QuestionDetailDto> {
    return QuestionDetailDto.fromDomain(
      await this.returnQuestion.execute(user, id, dto.note, dto.revision),
    )
  }
}

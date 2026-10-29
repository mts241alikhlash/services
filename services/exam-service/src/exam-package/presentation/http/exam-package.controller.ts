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
  Put,
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
import type { ScopeUser } from '../../../question/application/teacher-scope.service.js'
import { UpdateQuestionDto } from '../../../question/presentation/http/dto/request/update-question.dto.js'
import { AddPackageQuestionUseCase } from '../../application/use-cases/add-package-question/add-package-question.use-case.js'
import { ApproveExamPackageUseCase } from '../../application/use-cases/approve-exam-package/approve-exam-package.use-case.js'
import { CopyExamPackageUseCase } from '../../application/use-cases/copy-exam-package/copy-exam-package.use-case.js'
import { CreateDraftPackageUseCase } from '../../application/use-cases/create-draft-package/create-draft-package.use-case.js'
import { DeleteExamPackageUseCase } from '../../application/use-cases/delete-exam-package/delete-exam-package.use-case.js'
import { GetExamPackageUseCase } from '../../application/use-cases/get-exam-package/get-exam-package.use-case.js'
import { ListExamPackagesUseCase } from '../../application/use-cases/list-exam-packages/list-exam-packages.use-case.js'
import { RemovePackageQuestionUseCase } from '../../application/use-cases/remove-package-question/remove-package-question.use-case.js'
import { RenameExamPackageUseCase } from '../../application/use-cases/rename-exam-package/rename-exam-package.use-case.js'
import { ReorderPackageQuestionsUseCase } from '../../application/use-cases/reorder-package-questions/reorder-package-questions.use-case.js'
import { ReturnExamPackageUseCase } from '../../application/use-cases/return-exam-package/return-exam-package.use-case.js'
import { SubmitExamPackageUseCase } from '../../application/use-cases/submit-exam-package/submit-exam-package.use-case.js'
import { TakePackageQuestionsUseCase } from '../../application/use-cases/take-package-questions/take-package-questions.use-case.js'
import { UpdatePackageQuestionUseCase } from '../../application/use-cases/update-package-question/update-package-question.use-case.js'
import {
  AddPackageQuestionDto,
  ApproveExamPackageDto,
  CreateExamPackageDto,
  ExamPackageQueryDto,
  RenameExamPackageDto,
  ReorderPackageQuestionsDto,
  ReturnExamPackageDto,
  TakePackageQuestionsDto,
} from './dto/request/exam-package-request.dto.js'
import {
  ExamPackageDetailDto,
  ExamPackageListResponseDto,
  ExamPackageViewDto,
} from './dto/response/exam-package-response.dto.js'

const MANAGE_ALL = 'exam-questions.manage-all'

@ApiTags('Exam Packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-packages')
export class ExamPackageController {
  constructor(
    private readonly listPackages: ListExamPackagesUseCase,
    private readonly getPackage: GetExamPackageUseCase,
    private readonly createPackage: CreateDraftPackageUseCase,
    private readonly renamePackage: RenameExamPackageUseCase,
    private readonly deletePackage: DeleteExamPackageUseCase,
    private readonly copyPackage: CopyExamPackageUseCase,
    private readonly addPackageQuestion: AddPackageQuestionUseCase,
    private readonly updatePackageQuestion: UpdatePackageQuestionUseCase,
    private readonly removePackageQuestion: RemovePackageQuestionUseCase,
    private readonly reorderPackageQuestions: ReorderPackageQuestionsUseCase,
    private readonly takePackageQuestions: TakePackageQuestionsUseCase,
    private readonly submitPackage: SubmitExamPackageUseCase,
    private readonly approvePackage: ApproveExamPackageUseCase,
    private readonly returnExamPackage: ReturnExamPackageUseCase,
  ) {}

  @Get()
  @RequirePermissions('exam-packages.read')
  @ApiOperation({
    summary:
      'List packages: your own in every status and the approved or locked ones of others',
  })
  @ApiResponse({ status: 200, type: ExamPackageListResponseDto })
  async findAll(
    @CurrentUser() user: ScopeUser,
    @Query() query: ExamPackageQueryDto,
  ): Promise<ExamPackageListResponseDto> {
    return ExamPackageListResponseDto.fromDomain(
      await this.listPackages.execute(user, query),
    )
  }

  @Get(':id')
  @RequirePermissions('exam-packages.read')
  @ApiOperation({
    summary:
      'Get a package with its questions, their markers and the review history',
  })
  @ApiResponse({ status: 200, type: ExamPackageViewDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async findOne(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExamPackageViewDto> {
    return ExamPackageViewDto.fromDomain(
      await this.getPackage.execute(id, {
        id: user.id,
        canSeeAll: user.permissions.includes(MANAGE_ALL),
      }),
    )
  }

  @Post()
  @RequirePermissions('exam-packages.create')
  @ApiOperation({ summary: 'Create an empty draft package' })
  @ApiResponse({ status: 201, type: ExamPackageDetailDto })
  async create(
    @CurrentUser() user: ScopeUser,
    @Body() dto: CreateExamPackageDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.createPackage.execute(user, dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('exam-packages.update')
  @ApiOperation({ summary: 'Rename a package' })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async rename(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameExamPackageDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.renamePackage.execute(user, id, dto.title),
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('exam-packages.delete')
  @ApiOperation({
    summary: 'Delete a package that is not waiting for review or scheduled',
  })
  @ApiResponse({ status: 204 })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deletePackage.execute(id)
  }

  @Post(':id/copy')
  @RequirePermissions('exam-packages.create')
  @ApiOperation({
    summary: 'Copy an approved or scheduled package into a new draft',
  })
  @ApiResponse({ status: 201, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async copy(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.copyPackage.execute(user, id),
    )
  }

  @Post(':id/questions')
  @RequirePermissions('exam-packages.update')
  @ApiOperation({ summary: 'Write a new question inside a package' })
  @ApiResponse({ status: 201, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async addQuestion(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPackageQuestionDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.addPackageQuestion.execute(user, id, dto),
    )
  }

  @Post(':id/questions/take')
  @RequirePermissions('exam-packages.update')
  @ApiOperation({
    summary: 'Copy questions from an approved or scheduled package',
  })
  @ApiResponse({ status: 201, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async takeQuestions(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TakePackageQuestionsDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.takePackageQuestions.execute(
        user,
        id,
        dto.sourcePackageId,
        dto.questionIds,
      ),
    )
  }

  @Put(':id/questions/order')
  @RequirePermissions('exam-packages.update')
  @ApiOperation({ summary: 'Put the questions of a package in a new order' })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async reorderQuestions(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderPackageQuestionsDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.reorderPackageQuestions.execute(user, id, dto.questionIds),
    )
  }

  @Patch(':id/questions/:questionId')
  @RequirePermissions('exam-packages.update')
  @ApiOperation({ summary: 'Change a question of a package' })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  async updateQuestion(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.updatePackageQuestion.execute(user, id, questionId, dto),
    )
  }

  @Delete(':id/questions/:questionId')
  @RequirePermissions('exam-packages.update')
  @ApiOperation({ summary: 'Remove a question from a package' })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  async removeQuestion(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.removePackageQuestion.execute(user, id, questionId),
    )
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-packages.update')
  @ApiOperation({ summary: 'Submit a package for review' })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async submit(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.submitPackage.execute(user, id),
    )
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-questions.approve')
  @ApiOperation({ summary: 'Approve a submitted package' })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async approve(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveExamPackageDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.approvePackage.execute(user, id, dto.note),
    )
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('exam-questions.approve')
  @ApiOperation({
    summary: 'Return a submitted package with a note and notes on questions',
  })
  @ApiResponse({ status: 200, type: ExamPackageDetailDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  async returnPackage(
    @CurrentUser() user: ScopeUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnExamPackageDto,
  ): Promise<ExamPackageDetailDto> {
    return ExamPackageDetailDto.fromDomain(
      await this.returnExamPackage.execute(
        user,
        id,
        dto.note,
        dto.questionNotes,
      ),
    )
  }
}

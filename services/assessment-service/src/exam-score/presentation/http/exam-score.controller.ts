import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import {
  ListExamScoresUseCase,
  type ExamScoreReader,
} from '../../application/use-cases/list-exam-scores/list-exam-scores.use-case.js'
import {
  ExamScoreListResponseDto,
  ExamScoreQueryDto,
} from './dto/exam-score.dto.js'

@ApiTags('Exam Scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-scores')
export class ExamScoreController {
  constructor(private readonly list: ListExamScoresUseCase) {}

  @Get()
  @RequirePermissions('exam-scores.read')
  @ApiOperation({ summary: 'Exam scores of the classes the caller teaches' })
  @ApiResponse({ status: 200, type: ExamScoreListResponseDto })
  async findAll(
    @CurrentUser() user: ExamScoreReader,
    @Query() query: ExamScoreQueryDto,
  ): Promise<ExamScoreListResponseDto> {
    return ExamScoreListResponseDto.fromDomain(
      await this.list.execute(user, {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        semesterId: query.semesterId,
        classroomId: query.classroomId,
        subjectId: query.subjectId,
      }),
    )
  }
}

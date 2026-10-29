import { Controller, Get, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import type { ScopeUser } from '../../application/teacher-scope.service.js'
import { GetQuestionScopeUseCase } from '../../application/use-cases/get-question-scope/get-question-scope.use-case.js'
import { QuestionScopeDto } from './dto/response/question-response.dto.js'

@ApiTags('Exam Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exam-questions')
export class QuestionController {
  constructor(private readonly getScope: GetQuestionScopeUseCase) {}

  @Get('scope')
  @RequirePermissions('exam-packages.read')
  @ApiOperation({ summary: 'Subjects and grades the signed-in user may use' })
  @ApiResponse({ status: 200, type: QuestionScopeDto })
  async scope(@CurrentUser() user: ScopeUser): Promise<QuestionScopeDto> {
    return QuestionScopeDto.fromDomain(await this.getScope.execute(user))
  }
}

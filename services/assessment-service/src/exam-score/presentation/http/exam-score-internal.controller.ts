import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../core/guards/provisioning-token.guard.js'
import { UpsertExamScoreUseCase } from '../../application/use-cases/upsert-exam-score/upsert-exam-score.use-case.js'
import {
  ExamScoreReceiptDto,
  ReceiveExamScoreDto,
} from './dto/exam-score.dto.js'

@ApiTags('Exam Scores')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('exam-scores')
export class ExamScoreInternalController {
  constructor(private readonly upsert: UpsertExamScoreUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive the final score of an exam from exam-service',
  })
  @ApiResponse({ status: 200, type: ExamScoreReceiptDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async receive(
    @Body() dto: ReceiveExamScoreDto,
  ): Promise<ExamScoreReceiptDto> {
    const stored = await this.upsert.execute({
      ...dto,
      studentName: dto.studentName ?? null,
      studentNis: dto.studentNis ?? null,
      gradedAt: new Date(dto.gradedAt),
    })
    return ExamScoreReceiptDto.of(stored.id, stored.examSessionId)
  }
}

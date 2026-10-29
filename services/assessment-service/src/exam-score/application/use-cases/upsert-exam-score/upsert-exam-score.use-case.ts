import { Injectable } from '@nestjs/common'
import type {
  ExamScore,
  ExamScoreInput,
} from '../../../domain/entities/exam-score.entity.js'
import { IExamScoreRepository } from '../../../domain/repositories/exam-score.repository.js'

@Injectable()
export class UpsertExamScoreUseCase {
  constructor(private readonly scores: IExamScoreRepository) {}

  execute(input: ExamScoreInput): Promise<ExamScore> {
    return this.scores.upsert(input)
  }
}

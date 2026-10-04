import { Injectable } from '@nestjs/common'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import type {
  GetReportCardsInput,
  SelfServiceScope,
} from './get-report-cards.input.js'

@Injectable()
export class GetReportCardsUseCase {
  constructor(private readonly reportCardRepository: IReportCardRepository) {}

  async execute(query: GetReportCardsInput, scope?: SelfServiceScope) {
    return this.reportCardRepository.findAll({
      page: query.page,
      limit: query.limit,
      studentId: query.studentId,
      classroomId: query.classroomId,
      semesterId: query.semesterId,
      isPublished: query.isPublished,
      ...(scope && { studentId: scope.studentId, isPublished: true }),
    })
  }
}

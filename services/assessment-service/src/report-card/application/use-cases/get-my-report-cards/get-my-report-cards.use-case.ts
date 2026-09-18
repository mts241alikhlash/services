import { Injectable } from '@nestjs/common'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import { GetReportCardsUseCase } from '../get-report-cards/get-report-cards.use-case.js'
import type { GetMyReportCardsInput } from './get-my-report-cards.input.js'

@Injectable()
export class GetMyReportCardsUseCase {
  constructor(
    private readonly getReportCards: GetReportCardsUseCase,
    private readonly studentIdentity: IStudentIdentityReadPort,
  ) {}

  async execute(query: GetMyReportCardsInput, userId: string) {
    const studentId = await this.studentIdentity.findStudentIdByUserId(userId)

    if (!studentId) {
      return {
        data: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        summary: { published: 0, draft: 0, averageScore: null },
      }
    }

    return this.getReportCards.execute(query, { studentId })
  }
}

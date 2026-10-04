import type { ReportCardQueryInput } from '../../../domain/repositories/report-card.repository.js'

export type GetReportCardsInput = ReportCardQueryInput

export interface SelfServiceScope {
  studentId: string
}

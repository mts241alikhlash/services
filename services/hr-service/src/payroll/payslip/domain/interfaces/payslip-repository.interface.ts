import {
  PayslipDetail,
  PayslipSummary,
} from '../entities/payslip-detail.entity.js'

export interface MyPayslipQueryInput {
  year?: number
  month?: number
}

export abstract class IPayslipRepository {
  abstract findByRun(runId: string): Promise<PayslipSummary[]>
  abstract findById(id: string): Promise<PayslipDetail | null>

  abstract findOwn(
    userId: string,
    query: MyPayslipQueryInput,
  ): Promise<PayslipDetail | null>

  abstract findOwnerId(id: string): Promise<string | null>
}

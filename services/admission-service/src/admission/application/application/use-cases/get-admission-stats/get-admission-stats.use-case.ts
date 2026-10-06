import { Injectable } from '@nestjs/common'
import {
  IAdmissionApplicationRepository,
  type AdmissionStatsFilter,
} from '../../../domain/repositories/admission-application-repository.js'

@Injectable()
export class GetAdmissionStatsUseCase {
  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
  ) {}

  async execute(filter: AdmissionStatsFilter = {}) {
    const [statusCounts, waves] = await Promise.all([
      this.admissionApplicationRepository.getStatusCounts(filter),
      this.admissionApplicationRepository.getWavesWithAcceptedCount(filter),
    ])

    const byStatus = Object.fromEntries(
      statusCounts.map((s) => [s.status, s.count]),
    )
    const total = statusCounts.reduce((sum, s) => sum + s.count, 0)

    return {
      total,
      byStatus,
      waves: waves.map((w) => ({
        id: w.id,
        name: w.name,
        code: w.code,
        quota: w.quota,
        accepted: w.accepted,
        filled: w.filled ?? 0,
        quotaFillRate: w.quota > 0 ? (w.filled ?? 0) / w.quota : 0,
      })),
    }
  }
}

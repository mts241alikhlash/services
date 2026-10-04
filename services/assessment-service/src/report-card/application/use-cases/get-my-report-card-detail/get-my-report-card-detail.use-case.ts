import { Injectable, NotFoundException } from '@nestjs/common'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import { GetReportCardDetailUseCase } from '../get-report-card-detail/get-report-card-detail.use-case.js'

@Injectable()
export class GetMyReportCardDetailUseCase {
  constructor(
    private readonly getReportCardDetail: GetReportCardDetailUseCase,
    private readonly reportCardRepository: IReportCardRepository,
    private readonly studentIdentity: IStudentIdentityReadPort,
  ) {}

  async execute(id: string, userId: string) {
    const notFound = () =>
      new NotFoundException(`ReportCard with ID ${id} not found`)

    const studentId = await this.studentIdentity.findStudentIdByUserId(userId)
    if (!studentId) throw notFound()

    const ownership = await this.reportCardRepository.findOwnership(id)
    if (ownership?.studentId !== studentId) throw notFound()

    const detail = await this.getReportCardDetail.execute(id)
    if (!detail.isPublished) throw notFound()

    return detail
  }
}

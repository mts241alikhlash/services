import { Injectable, NotFoundException } from '@nestjs/common'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import { IAttendanceRepository } from '../../../../attendance/domain/repositories/attendance.repository.js'

@Injectable()
export class GetReportCardDetailUseCase {
  constructor(
    private readonly reportCardRepository: IReportCardRepository,
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  async execute(id: string) {
    const ownership = await this.reportCardRepository.findOwnership(id)
    if (!ownership) {
      throw new NotFoundException(`ReportCard with ID ${id} not found`)
    }

    const [reportCard, counts] = await Promise.all([
      this.reportCardRepository.findById(id),
      this.attendanceRepository.getStatusCounts(ownership.enrollmentId),
    ])

    if (!reportCard) {
      throw new NotFoundException(`ReportCard with ID ${id} not found`)
    }

    return {
      ...reportCard,
      attendance: {
        SICK: counts.sick,
        EXCUSED: counts.excused,
        ABSENT: counts.absent,
      },
    }
  }
}

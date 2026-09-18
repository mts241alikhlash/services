import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ISchoolUnitIdentityReadPort } from '../../../../platform/school-unit-identity/school-unit-identity.port.js'
import { IAttendanceRepository } from '../../../../attendance/domain/repositories/attendance.repository.js'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import { PdfService } from '../../services/pdf.service.js'
import { type SubjectGradeRow } from '../../services/calculate-subject-grades.js'
import {
  buildReportCardHtml,
  ReportCardPdfViewModel,
} from '../../services/report-card-pdf.template.js'

@Injectable()
export class ExportReportCardPdfUseCase {
  constructor(
    private readonly reportCardRepository: IReportCardRepository,
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly pdfService: PdfService,
    private readonly schoolUnitIdentityReadPort: ISchoolUnitIdentityReadPort,
  ) {}

  async execute(id: string): Promise<Buffer> {
    const reportCard = await this.reportCardRepository.findById(id)
    if (!reportCard) {
      throw new NotFoundException('Report card not found')
    }

    if (!reportCard.isPublished) {
      throw new BadRequestException('Report card has not been published yet')
    }

    const enrollmentId =
      reportCard.enrollmentId ?? reportCard.studentEnrollmentId ?? ''

    const attendanceCounts =
      await this.attendanceRepository.getStatusCounts(enrollmentId)

    const schoolUnit =
      await this.schoolUnitIdentityReadPort.findSchoolUnitProfile()
    const schoolName = schoolUnit?.name ?? 'SIAKAD Sekolah'
    const schoolAddress = schoolUnit?.email ?? schoolUnit?.phone ?? ''

    const subjectsData: SubjectGradeRow[] = (reportCard.subjects ?? []).map(
      (subject, index) => ({
        no: index + 1,
        subjectId: subject.subjectId,
        code: subject.subjectCode ?? '',
        name: subject.subjectName,
        score: subject.score.toFixed(2),
        scoreValue: subject.score,
        passingScore: subject.passingScore,
        predicate: subject.predicate,
        description: subject.description,
        isComplete: subject.isComplete,
      }),
    )

    const studentName =
      reportCard.enrollment?.student?.user?.profile?.name ?? '-'
    const studentNis = reportCard.enrollment?.student?.nis ?? '-'
    const className = reportCard.enrollment?.classroom?.name ?? '-'
    const semesterType =
      reportCard.enrollment?.semester?.type?.name === 'ODD'
        ? '1 (Ganjil)'
        : '2 (Genap)'
    const academicYearName =
      reportCard.enrollment?.semester?.academicYear?.name ?? '-'

    const viewModel: ReportCardPdfViewModel = {
      studentName,
      studentNis,
      className,
      semesterType,
      academicYearName,
      schoolName,
      schoolAddress,
      sickCount: attendanceCounts.sick,
      excusedCount: attendanceCounts.excused,
      absentCount: attendanceCounts.absent,
      employeeNote: reportCard.employeeNote ?? reportCard.employeeNotes ?? null,
      subjectsData,
    }

    return this.pdfService.generatePdf(buildReportCardHtml(viewModel))
  }
}

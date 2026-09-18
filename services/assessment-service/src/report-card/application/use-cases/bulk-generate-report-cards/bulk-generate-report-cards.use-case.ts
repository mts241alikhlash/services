import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { EnrollmentStatus } from '../../../../shared/domain/enums/enrollment-status.enum.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { BULK_GENERATE_ENROLLMENT_LIMIT } from '../../../constants/report-card.constants.js'
import { GenerateReportCardUseCase } from '../generate-report-card/generate-report-card.use-case.js'
import type {
  BulkGenerateReportCardsInput,
  BulkGenerateReportCardsResult,
} from './bulk-generate-report-cards.input.js'

@Injectable()
export class BulkGenerateReportCardsUseCase {
  private readonly logger = new Logger(BulkGenerateReportCardsUseCase.name)

  constructor(
    private readonly enrollmentLookup: IEnrollmentLookupPort,
    private readonly generateReportCardUseCase: GenerateReportCardUseCase,
  ) {}

  async execute(
    input: BulkGenerateReportCardsInput,
  ): Promise<BulkGenerateReportCardsResult> {
    const enrollments = await this.enrollmentLookup.listByClassroom(
      input.classroomId,
      input.semesterId,
      BULK_GENERATE_ENROLLMENT_LIMIT,
    )

    let generated = 0
    const skippedEnrollmentIds: string[] = []

    for (const enrollment of enrollments) {
      try {
        await this.generateReportCardUseCase.execute({
          enrollmentId: enrollment.id,
        })
        generated += 1
      } catch (error) {
        if (error instanceof ConflictException) {
          skippedEnrollmentIds.push(enrollment.id)
          continue
        }
        throw error
      }
    }

    this.logger.log(
      `Bulk generated report cards for classroom ${input.classroomId} — generated: ${generated}, skipped: ${skippedEnrollmentIds.length}`,
    )

    return {
      total: enrollments.length,
      generated,
      skipped: skippedEnrollmentIds.length,
      skippedEnrollmentIds,
    }
  }
}

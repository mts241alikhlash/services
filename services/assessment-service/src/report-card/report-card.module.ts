import { Module } from '@nestjs/common'
import { AssessmentModule } from '../assessment/assessment.module.js'
import { AttendanceModule } from '../attendance/attendance.module.js'
import { SchoolUnitIdentityModule } from '../platform/school-unit-identity/school-unit-identity.module.js'
import { StudentIdentityModule } from '../platform/student-identity/student-identity.module.js'
import { IReportCardRepository } from './domain/repositories/report-card.repository.js'
import { PrismaReportCardRepository } from './infrastructure/persistence/prisma/prisma-report-card.repository.js'
import { ReportCardController } from './presentation/http/report-card.controller.js'
import { BulkGenerateReportCardsUseCase } from './application/use-cases/bulk-generate-report-cards/bulk-generate-report-cards.use-case.js'
import { DeleteReportCardUseCase } from './application/use-cases/delete-report-card/delete-report-card.use-case.js'
import { GenerateReportCardUseCase } from './application/use-cases/generate-report-card/generate-report-card.use-case.js'
import { GetReportCardByIdUseCase } from './application/use-cases/get-report-card-by-id/get-report-card-by-id.use-case.js'
import { GetReportCardsUseCase } from './application/use-cases/get-report-cards/get-report-cards.use-case.js'
import { GetMyReportCardsUseCase } from './application/use-cases/get-my-report-cards/get-my-report-cards.use-case.js'
import { GetReportCardDetailUseCase } from './application/use-cases/get-report-card-detail/get-report-card-detail.use-case.js'
import { GetMyReportCardDetailUseCase } from './application/use-cases/get-my-report-card-detail/get-my-report-card-detail.use-case.js'
import { PublishReportCardUseCase } from './application/use-cases/publish-report-card/publish-report-card.use-case.js'
import { UpdateReportCardUseCase } from './application/use-cases/update-report-card/update-report-card.use-case.js'
import { ExportReportCardPdfUseCase } from './application/use-cases/export-report-card-pdf/export-report-card-pdf.use-case.js'
import { PdfService } from './application/services/pdf.service.js'
import { ReportCardInternalController } from './presentation/http/report-card-internal.controller.js'

@Module({
  imports: [
    AssessmentModule,
    AttendanceModule,
    SchoolUnitIdentityModule,
    StudentIdentityModule,
  ],
  controllers: [ReportCardInternalController, ReportCardController],
  providers: [
    {
      provide: IReportCardRepository,
      useClass: PrismaReportCardRepository,
    },
    GetReportCardsUseCase,
    GetMyReportCardsUseCase,
    GetReportCardByIdUseCase,
    GetReportCardDetailUseCase,
    GetMyReportCardDetailUseCase,
    GenerateReportCardUseCase,
    BulkGenerateReportCardsUseCase,
    UpdateReportCardUseCase,
    PublishReportCardUseCase,
    DeleteReportCardUseCase,
    PdfService,
    ExportReportCardPdfUseCase,
  ],
  exports: [IReportCardRepository],
})
export class ReportCardModule {}

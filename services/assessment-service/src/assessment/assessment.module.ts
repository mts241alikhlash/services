import { Module } from '@nestjs/common'
import { AssessmentItemController } from './presentation/http/assessment-item.controller.js'
import { AssessmentWeightController } from './presentation/http/assessment-weight.controller.js'
import { StudentScoreController } from './presentation/http/student-score.controller.js'
import { PrismaAssessmentItemRepository } from './infrastructure/persistence/prisma/prisma-assessment-item.repository.js'
import { PrismaAssessmentWeightRepository } from './infrastructure/persistence/prisma/prisma-assessment-weight.repository.js'
import { PrismaStudentScoreRepository } from './infrastructure/persistence/prisma/prisma-student-score.repository.js'
import { IAssessmentItemRepository } from './domain/repositories/assessment-item.repository.js'
import { IAssessmentWeightRepository } from './domain/repositories/assessment-weight.repository.js'
import { IStudentScoreRepository } from './domain/repositories/student-score.repository.js'
import { GetAssessmentItemsUseCase } from './application/use-cases/get-assessment-items/get-assessment-items.use-case.js'
import { GetAssessmentItemByIdUseCase } from './application/use-cases/get-assessment-item-by-id/get-assessment-item-by-id.use-case.js'
import { CreateAssessmentItemUseCase } from './application/use-cases/create-assessment-item/create-assessment-item.use-case.js'
import { UpdateAssessmentItemUseCase } from './application/use-cases/update-assessment-item/update-assessment-item.use-case.js'
import { DeleteAssessmentItemUseCase } from './application/use-cases/delete-assessment-item/delete-assessment-item.use-case.js'
import { GetAssessmentWeightsUseCase } from './application/use-cases/get-assessment-weights/get-assessment-weights.use-case.js'
import { ReplaceAssessmentWeightsUseCase } from './application/use-cases/replace-assessment-weights/replace-assessment-weights.use-case.js'
import { GetStudentScoresUseCase } from './application/use-cases/get-student-scores/get-student-scores.use-case.js'
import { GetMyStudentScoresUseCase } from './application/use-cases/get-my-student-scores/get-my-student-scores.use-case.js'
import { StudentIdentityModule } from '../platform/student-identity/student-identity.module.js'
import { GetStudentScoreByIdUseCase } from './application/use-cases/get-student-score-by-id/get-student-score-by-id.use-case.js'
import { CreateStudentScoreUseCase } from './application/use-cases/create-student-score/create-student-score.use-case.js'
import { UpdateStudentScoreUseCase } from './application/use-cases/update-student-score/update-student-score.use-case.js'
import { DeleteStudentScoreUseCase } from './application/use-cases/delete-student-score/delete-student-score.use-case.js'
import { GetStudentScoreRosterUseCase } from './application/use-cases/get-student-score-roster/get-student-score-roster.use-case.js'
import { BulkUpsertStudentScoresUseCase } from './application/use-cases/bulk-upsert-student-scores/bulk-upsert-student-scores.use-case.js'
import { GradeAssignedStudentScoresUseCase } from './application/use-cases/grade-assigned-student-scores/grade-assigned-student-scores.use-case.js'
import { IGradingScopeReadPort } from './domain/repositories/grading-scope-read.port.js'
import { PrismaGradingScopeReadPort } from './infrastructure/persistence/prisma/prisma-grading-scope.read-port.js'
import { EmployeeIdentityModule } from '../platform/employee-identity/employee-identity.module.js'

@Module({
  imports: [StudentIdentityModule, EmployeeIdentityModule],
  controllers: [
    AssessmentItemController,
    AssessmentWeightController,
    StudentScoreController,
  ],
  providers: [
    {
      provide: IAssessmentItemRepository,
      useClass: PrismaAssessmentItemRepository,
    },
    {
      provide: IAssessmentWeightRepository,
      useClass: PrismaAssessmentWeightRepository,
    },
    {
      provide: IStudentScoreRepository,
      useClass: PrismaStudentScoreRepository,
    },
    GetAssessmentItemsUseCase,
    GetAssessmentItemByIdUseCase,
    CreateAssessmentItemUseCase,
    UpdateAssessmentItemUseCase,
    DeleteAssessmentItemUseCase,
    GetAssessmentWeightsUseCase,
    ReplaceAssessmentWeightsUseCase,
    GetStudentScoresUseCase,
    GetMyStudentScoresUseCase,
    GetStudentScoreByIdUseCase,
    CreateStudentScoreUseCase,
    UpdateStudentScoreUseCase,
    DeleteStudentScoreUseCase,
    GetStudentScoreRosterUseCase,
    BulkUpsertStudentScoresUseCase,
    GradeAssignedStudentScoresUseCase,
    {
      provide: IGradingScopeReadPort,
      useClass: PrismaGradingScopeReadPort,
    },
  ],
  exports: [
    IAssessmentItemRepository,
    IAssessmentWeightRepository,
    IStudentScoreRepository,
  ],
})
export class AssessmentModule {}

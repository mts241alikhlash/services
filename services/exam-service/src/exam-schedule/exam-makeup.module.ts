import { Module } from '@nestjs/common'
import { ExamPackageModule } from '../exam-package/exam-package.module.js'
import { ExamSessionModule } from '../exam-session/exam-session.module.js'
import { ExamScheduleModule } from './exam-schedule.module.js'
import { ListAbsenteesUseCase } from './application/use-cases/list-absentees/list-absentees.use-case.js'
import { MakeupCandidatesService } from './application/makeup-candidates.service.js'
import { ExamMakeupController } from './presentation/http/exam-makeup.controller.js'

@Module({
  imports: [ExamPackageModule, ExamScheduleModule, ExamSessionModule],
  controllers: [ExamMakeupController],
  providers: [MakeupCandidatesService, ListAbsenteesUseCase],
})
export class ExamMakeupModule {}

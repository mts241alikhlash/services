import { Module } from '@nestjs/common'
import { ExamPackageModule } from '../exam-package/exam-package.module.js'
import { ExamSessionModule } from '../exam-session/exam-session.module.js'
import { ExamScheduleModule } from './exam-schedule.module.js'
import { AddMakeupParticipantsUseCase } from './application/use-cases/makeup-participants/add-makeup-participants.use-case.js'
import { GetMakeupParticipantsUseCase } from './application/use-cases/makeup-participants/get-makeup-participants.use-case.js'
import { RemoveMakeupParticipantUseCase } from './application/use-cases/makeup-participants/remove-makeup-participant.use-case.js'
import { CreateMakeupUseCase } from './application/use-cases/create-makeup/create-makeup.use-case.js'
import { ListAbsenteesUseCase } from './application/use-cases/list-absentees/list-absentees.use-case.js'
import { GradingScopeService } from '../exam-grading/application/grading-scope.service.js'
import { MakeupScopeService } from './application/makeup-scope.service.js'
import { MakeupParticipantsService } from './application/makeup-participants.service.js'
import { MakeupCandidatesService } from './application/makeup-candidates.service.js'
import { ExamMakeupController } from './presentation/http/exam-makeup.controller.js'

@Module({
  imports: [ExamPackageModule, ExamScheduleModule, ExamSessionModule],
  controllers: [ExamMakeupController],
  providers: [
    GradingScopeService,
    MakeupScopeService,
    MakeupCandidatesService,
    MakeupParticipantsService,
    ListAbsenteesUseCase,
    CreateMakeupUseCase,
    AddMakeupParticipantsUseCase,
    RemoveMakeupParticipantUseCase,
    GetMakeupParticipantsUseCase,
  ],
})
export class ExamMakeupModule {}

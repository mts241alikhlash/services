import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  GradingScopeService,
  type GradingUser,
} from '../../exam-grading/application/grading-scope.service.js'
import type { ExamSchedule } from '../domain/entities/exam-schedule.entity.js'

@Injectable()
export class MakeupScopeService {
  constructor(private readonly scope: GradingScopeService) {}

  async assertAllowed(
    user: GradingUser,
    schedule: ExamSchedule,
  ): Promise<void> {
    const scope = await this.scope.forUser(user)
    const allowed = await scope.allows(
      schedule.subjectId,
      schedule.classroomId,
      schedule.semesterId,
    )
    if (!allowed) {
      throw new ForbiddenException('Anda tidak mengajar mapel ini di kelas ini')
    }
  }
}

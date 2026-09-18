import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.js'
import { IScheduleLookupRepository } from '../../../domain/repositories/schedule-lookup.repository.js'
import { assertSlotIsFree } from '../../../domain/policies/assert-slot-is-free.policy.js'
import type { BatchUpsertScheduleInput } from './batch-upsert-schedule.input.js'

@Injectable()
export class BatchUpsertScheduleUseCase {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly lookupRepository: IScheduleLookupRepository,
  ) {}

  async execute(classroomId: string, input: BatchUpsertScheduleInput) {
    const classroom =
      await this.lookupRepository.findValidClassroomById(classroomId)
    if (!classroom) {
      throw new NotFoundException('Classroom not found')
    }

    const semester = await this.lookupRepository.findActiveSemester()
    if (!semester) {
      throw new BadRequestException('Tidak ada semester aktif')
    }

    await this.scheduleRepository.softDeleteByClassroomAndDay(
      classroomId,
      input.day,
    )

    if (input.lessons.length === 0) {
      return { created: 0, day: input.day }
    }

    let created = 0
    for (const row of input.lessons) {
      let ta =
        await this.lookupRepository.findTeachingAssignmentBySubjectAndSemester(
          classroomId,
          row.subjectId,
          semester.id,
        )

      if (!ta) {
        const employeeId =
          await this.lookupRepository.findAnyEmployeeIdForSubject(row.subjectId)

        if (!employeeId) {
          throw new BadRequestException(
            `No employee is assigned to the subject ${row.subjectId}`,
          )
        }

        ta = await this.lookupRepository.createTeachingAssignment({
          classroomId,
          subjectId: row.subjectId,
          employeeId,
          semesterId: semester.id,
        })
      }

      await assertSlotIsFree(this.scheduleRepository, {
        employeeId: ta.employeeId,
        classroomId,
        semesterId: semester.id,
        timeSlotId: row.timeSlotId,
        day: input.day,
      })

      const softDeleted = await this.scheduleRepository.findSoftDeleted(
        ta.id,
        input.day,
        row.timeSlotId,
      )
      if (softDeleted) {
        await this.scheduleRepository.restore(softDeleted.id, {})
      } else {
        await this.scheduleRepository.create({
          teachingAssignmentId: ta.id,
          timeSlotId: row.timeSlotId,
          day: input.day,
        })
      }
      created++
    }

    return { created, day: input.day }
  }
}

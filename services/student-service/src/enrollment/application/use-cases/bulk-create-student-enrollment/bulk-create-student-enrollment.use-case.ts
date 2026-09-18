import { Injectable } from '@nestjs/common'
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js'
import { ClassroomCapacityService } from '../../services/classroom-capacity.service.js'
import type { CreateStudentEnrollmentInput } from '../create-student-enrollment/create-student-enrollment.input.js'
import type { BulkCreateStudentEnrollmentInput } from './bulk-create-student-enrollment.input.js'

@Injectable()
export class BulkCreateStudentEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly classroomCapacity: ClassroomCapacityService,
  ) {}

  async execute(input: BulkCreateStudentEnrollmentInput) {
    const toCreate: CreateStudentEnrollmentInput[] = []
    const toRestore: { id: string; item: CreateStudentEnrollmentInput }[] = []
    const skipped: string[] = []

    for (const item of input.enrollments) {
      const dup = await this.enrollmentRepository.findDuplicate(
        item.studentId,
        item.semesterId,
      )
      if (dup) {
        skipped.push(item.studentId)
        continue
      }

      const softDeleted = await this.enrollmentRepository.findSoftDeleted(
        item.studentId,
        item.semesterId,
      )
      if (softDeleted) {
        toRestore.push({ id: softDeleted.id, item })
      } else {
        toCreate.push(item)
      }
    }

    const arriving = new Map<
      string,
      { count: number; item: { classroomId: string; semesterId: string } }
    >()
    for (const item of [...toCreate, ...toRestore.map((r) => r.item)]) {
      const key = `${item.classroomId}:${item.semesterId}`
      const entry = arriving.get(key)
      if (entry) entry.count += 1
      else arriving.set(key, { count: 1, item })
    }

    for (const { count, item } of arriving.values()) {
      await this.classroomCapacity.assertRoomFor({
        classroomId: item.classroomId,
        semesterId: item.semesterId,
        incoming: count,
      })
    }

    for (const { id, item } of toRestore) {
      await this.enrollmentRepository.restore(id, {
        classroomId: item.classroomId,
      })
    }

    const created =
      toCreate.length > 0
        ? await this.enrollmentRepository.createMany(toCreate)
        : { count: 0 }

    return {
      created: created.count + toRestore.length,
      skipped: skipped.length,
      errors: skipped.map(
        (sid) => `Student ${sid} is already enrolled in this semester`,
      ),
    }
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'
import {
  assertWindowNotPast,
  validateScheduleWindow,
} from '../../../domain/policies/validate-schedule-window.policy.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'

export interface CreateExamScheduleInput {
  packageId: string
  classroomId: string
  startsAt: Date
  endsAt: Date
  durationMinutes: number
}

@Injectable()
export class CreateExamScheduleUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly academic: IAcademicLookupPort,
  ) {}

  async execute(
    user: { id: string },
    input: CreateExamScheduleInput,
    now: Date = new Date(),
  ): Promise<ExamSchedule> {
    validateScheduleWindow(input)
    assertWindowNotPast(input, now)

    const examPackage = await this.packages.findById(input.packageId)
    if (examPackage === null)
      throw new NotFoundException('Paket tidak ditemukan')

    const semester = await this.academic.activeSemester()
    if (semester === null) {
      throw new ConflictException('Belum ada semester aktif')
    }

    const [classroom] = await this.academic.classroomsByIds([input.classroomId])
    if (classroom === undefined) {
      throw new NotFoundException('Kelas tidak ditemukan')
    }
    if (classroom.gradeId !== examPackage.gradeId) {
      throw new BadRequestException(
        'Tingkat kelas tidak sama dengan tingkat paket',
      )
    }
    if (classroom.academicYearId !== semester.academicYearId) {
      throw new BadRequestException('Kelas bukan kelas tahun ajaran aktif')
    }

    const created = await this.schedules.createAndLockPackage({
      packageId: input.packageId,
      classroomId: input.classroomId,
      semesterId: semester.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      durationMinutes: input.durationMinutes,
      createdById: user.id,
    })
    if (created === null) throw new NotFoundException('Paket tidak ditemukan')
    return created
  }
}

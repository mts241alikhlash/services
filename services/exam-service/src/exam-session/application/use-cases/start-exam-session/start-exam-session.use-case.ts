import { randomBytes } from 'node:crypto'
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AccessCodeService } from '../../../../exam-schedule/application/access-code.service.js'
import type { ExamSchedule } from '../../../../exam-schedule/domain/entities/exam-schedule.entity.js'
import { loadSittings } from '../../../../exam-schedule/application/student-sittings.js'
import { assessMakeupEligibility } from '../../../../exam-schedule/domain/policies/makeup-eligibility.policy.js'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import type { ExamSession } from '../../../domain/entities/exam-session.entity.js'
import { isLocked } from '../../../domain/policies/access-attempt.policy.js'
import { computeTimes } from '../../../domain/policies/session-times.policy.js'
import { IExamAccessAttemptRepository } from '../../../domain/repositories/exam-access-attempt.repository.js'
import { ISessionFinalizer } from '../../../domain/repositories/session-finalizer.port.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

export interface StartedSession {
  sessionId: string
  deadline: Date
  serverTime: Date
}

@Injectable()
export class StartExamSessionUseCase {
  constructor(
    private readonly students: IStudentIdentityReadPort,
    private readonly enrollments: IEnrollmentLookupPort,
    private readonly schedules: IExamScheduleRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly attempts: IExamAccessAttemptRepository,
    private readonly codes: AccessCodeService,
    private readonly finalizer: ISessionFinalizer,
  ) {}

  async execute(
    user: { id: string },
    scheduleId: string,
    input: { accessCode: string; deviceId: string },
    now: Date = new Date(),
  ): Promise<StartedSession> {
    const studentId = await this.students.findStudentIdByUserId(user.id)
    if (studentId === null) {
      throw new ForbiddenException('Akun ini bukan akun siswa')
    }
    const enrollment = await this.enrollments.findActiveByStudent(studentId)
    if (enrollment === null) {
      throw new ForbiddenException('Anda belum terdaftar di kelas aktif')
    }

    const schedule = await this.schedules.findById(scheduleId)
    if (schedule === null) {
      throw new NotFoundException('Jadwal ujian tidak ditemukan')
    }
    if (schedule.kind === 'MAKEUP') {
      await this.assertMakeupAccess(schedule, studentId)
    } else if (
      schedule.classroomId !== enrollment.classroomId ||
      schedule.semesterId !== enrollment.semesterId
    ) {
      throw new ForbiddenException('Ujian ini bukan untuk kelas Anda')
    } else {
      await this.assertNoMakeupSitting(schedule.id, studentId)
    }
    if (schedule.status !== 'SCHEDULED') {
      throw new ForbiddenException('Jadwal ujian sudah dibatalkan')
    }
    if (now.getTime() < schedule.startsAt.getTime()) {
      throw new ForbiddenException('Ujian belum dibuka')
    }
    if (now.getTime() >= schedule.endsAt.getTime()) {
      throw new ForbiddenException('Waktu ujian sudah berakhir')
    }

    const state = await this.attempts.get(schedule.id, studentId)
    if (isLocked(state, now)) {
      throw new HttpException(
        'Terlalu banyak percobaan. Coba lagi beberapa menit lagi',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
    const correct = this.codes.matches(
      schedule.id,
      schedule.tokenRotation,
      input.accessCode,
    )
    if (correct) {
      if (state.failures > 0) await this.attempts.clear(schedule.id, studentId)
    } else {
      await this.attempts.registerFailure(schedule.id, studentId, now)
    }
    if (!correct) throw new ForbiddenException('Token ujian salah')

    const existing = await this.sessions.findByScheduleAndStudent(
      schedule.id,
      studentId,
    )
    if (existing !== null) {
      return this.resume(
        await this.finalizer.finalizeIfDue(existing, now),
        input.deviceId,
        now,
      )
    }

    const { deadline, finalizeAt } = computeTimes({
      startedAt: now,
      durationMinutes: schedule.durationMinutes,
      scheduleEndsAt: schedule.endsAt,
    })
    const created = await this.sessions.createInitial({
      scheduleId: schedule.id,
      studentId,
      userId: user.id,
      deviceId: input.deviceId,
      enrollmentId: enrollment.id,
      shuffleSeed: randomBytes(16).toString('hex'),
      startedAt: now,
      deadline,
      finalizeAt,
    })
    if (created !== null) return this.result(created, now)

    const raced = await this.sessions.findByScheduleAndStudent(
      schedule.id,
      studentId,
    )
    if (raced === null) {
      throw new ConflictException('Sesi ujian tidak dapat dibuat. Coba lagi')
    }
    return this.resume(
      await this.finalizer.finalizeIfDue(raced, now),
      input.deviceId,
      now,
    )
  }

  private async assertMakeupAccess(
    schedule: ExamSchedule,
    studentId: string,
  ): Promise<void> {
    const participation = await this.schedules.findParticipation(
      schedule.id,
      studentId,
    )
    if (participation === null) {
      throw new ForbiddenException('Anda tidak terdaftar di ujian susulan ini')
    }
    if (schedule.makeupOfId === null) return
    const original = await this.schedules.findById(schedule.makeupOfId)
    if (original?.status !== 'SCHEDULED') {
      throw new ForbiddenException('Ujian utama sudah dibatalkan')
    }
    await this.assertNotSat(original.id, studentId, schedule.id)
  }

  private async assertNoMakeupSitting(
    scheduleId: string,
    studentId: string,
  ): Promise<void> {
    const makeups = (await this.schedules.findMakeupsOf(scheduleId)).filter(
      (makeup) => makeup.status === 'SCHEDULED',
    )
    if (makeups.length === 0) return
    const found = await this.sessions.listByStudentAndSchedules(
      studentId,
      makeups.map((makeup) => makeup.id),
    )
    if (found.length > 0) {
      throw new ForbiddenException('Anda sudah mengikuti ujian ini')
    }
  }

  private async assertNotSat(
    originalId: string,
    studentId: string,
    excludeScheduleId: string,
  ): Promise<void> {
    const sittings = await loadSittings(
      this.schedules,
      this.sessions,
      originalId,
      studentId,
      excludeScheduleId,
    )
    if (!assessMakeupEligibility({ sittings, onLiveMakeup: false }).eligible) {
      throw new ForbiddenException('Anda sudah mengikuti ujian ini')
    }
  }

  private async resume(
    session: ExamSession,
    deviceId: string,
    now: Date,
  ): Promise<StartedSession> {
    if (session.status !== 'IN_PROGRESS') {
      throw new ConflictException('Ujian sudah dikumpulkan')
    }
    if (session.deviceId === deviceId) return this.result(session, now)
    if (session.deviceId !== null) {
      throw new ConflictException(
        'Sesi aktif di perangkat lain. Minta pengawas melepas sesi',
      )
    }
    const bound = await this.sessions.bindDevice(session.id, deviceId)
    if (bound === null) {
      throw new ConflictException(
        'Sesi aktif di perangkat lain. Minta pengawas melepas sesi',
      )
    }
    return this.result(bound, now)
  }

  private result(session: ExamSession, now: Date): StartedSession {
    return {
      sessionId: session.id,
      deadline: session.deadline,
      serverTime: now,
    }
  }
}

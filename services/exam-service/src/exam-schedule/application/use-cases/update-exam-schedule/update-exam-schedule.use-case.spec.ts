import { ConflictException, NotFoundException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { CancelExamScheduleUseCase } from '../cancel-exam-schedule/cancel-exam-schedule.use-case.js'
import { CreateExamScheduleUseCase } from '../create-exam-schedule/create-exam-schedule.use-case.js'
import { FakeScheduleSessionGuard } from '../../schedule-session-guard.fake.js'
import { FakeExamScheduleRepository } from '../../exam-schedule.repository.fake.js'
import {
  CLASSROOM_7A,
  END,
  FakeAcademicLookup,
  START,
  USER,
  approvedPackage,
} from '../../exam-schedule.test-support.js'
import { UpdateExamScheduleUseCase } from './update-exam-schedule.use-case.js'

describe('Update and cancel exam schedule', () => {
  let schedules: FakeExamScheduleRepository
  let guard: FakeScheduleSessionGuard
  let scheduleId: string

  beforeEach(async () => {
    guard = new FakeScheduleSessionGuard()
    const packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    const pkg = await approvedPackage(packages, new FakeQuestionRepository())
    scheduleId = (
      await new CreateExamScheduleUseCase(
        schedules,
        packages,
        new FakeAcademicLookup(),
      ).execute(USER, {
        packageId: pkg.id,
        classroomId: CLASSROOM_7A.id,
        startsAt: START,
        endsAt: END,
        durationMinutes: 90,
        type: 'UH',
      })
    ).id
  })

  const later = new Date('2026-11-02T06:00:00.000Z')

  it('changes the window and the duration', async () => {
    const updated = await new UpdateExamScheduleUseCase(
      schedules,
      guard,
    ).execute(scheduleId, {
      startsAt: START,
      endsAt: later,
      durationMinutes: 120,
      type: 'UH',
    })

    expect(updated.endsAt).toEqual(later)
    expect(updated.durationMinutes).toBe(120)
  })

  it('changes the exam type while nobody has started', async () => {
    const updated = await new UpdateExamScheduleUseCase(
      schedules,
      guard,
    ).execute(scheduleId, {
      startsAt: START,
      endsAt: END,
      durationMinutes: 90,
      type: 'UAS',
    })

    expect(updated.type).toBe('UAS')
    expect((await schedules.findById(scheduleId))?.type).toBe('UAS')
  })

  it('refuses an invalid window without changing the schedule', async () => {
    await expect(
      new UpdateExamScheduleUseCase(schedules, guard).execute(scheduleId, {
        startsAt: START,
        endsAt: END,
        durationMinutes: 500,
        type: 'UH',
      }),
    ).rejects.toThrow('Durasi tidak boleh lebih panjang')
    expect((await schedules.findById(scheduleId))?.durationMinutes).toBe(90)
  })

  it('answers 404 for an unknown schedule', async () => {
    await expect(
      new UpdateExamScheduleUseCase(schedules, guard).execute(
        '00000000-0000-4000-8000-000000000000',
        { startsAt: START, endsAt: END, durationMinutes: 60, type: 'UH' },
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it('cancel marks the schedule cancelled', async () => {
    await new CancelExamScheduleUseCase(schedules, guard).execute(scheduleId)

    expect((await schedules.findById(scheduleId))?.status).toBe('CANCELLED')
  })

  it('refuses to update or cancel a cancelled schedule', async () => {
    await new CancelExamScheduleUseCase(schedules, guard).execute(scheduleId)

    await expect(
      new UpdateExamScheduleUseCase(schedules, guard).execute(scheduleId, {
        startsAt: START,
        endsAt: END,
        durationMinutes: 60,
        type: 'UH',
      }),
    ).rejects.toThrow(ConflictException)
    await expect(
      new CancelExamScheduleUseCase(schedules, guard).execute(scheduleId),
    ).rejects.toThrow(ConflictException)
  })

  describe('once students have sessions', () => {
    beforeEach(() => guard.withSessions.add(scheduleId))

    it('cannot be cancelled', async () => {
      await expect(
        new CancelExamScheduleUseCase(schedules, guard).execute(scheduleId),
      ).rejects.toThrow('Jadwal sudah punya sesi dan tidak bisa dibatalkan')
      expect((await schedules.findById(scheduleId))?.status).toBe('SCHEDULED')
    })

    it('keeps its exam type', async () => {
      await expect(
        new UpdateExamScheduleUseCase(schedules, guard).execute(scheduleId, {
          startsAt: START,
          endsAt: later,
          durationMinutes: 90,
          type: 'UTS',
        }),
      ).rejects.toThrow(
        'Jadwal sudah punya sesi: hanya waktu selesai yang bisa diperpanjang',
      )
      expect((await schedules.findById(scheduleId))?.type).toBe('UH')
    })

    it('can only be extended', async () => {
      const useCase = new UpdateExamScheduleUseCase(schedules, guard)

      const extended = await useCase.execute(scheduleId, {
        startsAt: START,
        endsAt: later,
        durationMinutes: 90,
        type: 'UH',
      })
      expect(extended.endsAt).toEqual(later)

      const message =
        'Jadwal sudah punya sesi: hanya waktu selesai yang bisa diperpanjang'
      await expect(
        useCase.execute(scheduleId, {
          startsAt: new Date(START.getTime() + 60_000),
          endsAt: later,
          durationMinutes: 90,
          type: 'UH',
        }),
      ).rejects.toThrow(message)
      await expect(
        useCase.execute(scheduleId, {
          startsAt: START,
          endsAt: later,
          durationMinutes: 60,
          type: 'UH',
        }),
      ).rejects.toThrow(message)
      await expect(
        useCase.execute(scheduleId, {
          startsAt: START,
          endsAt: END,
          durationMinutes: 90,
          type: 'UH',
        }),
      ).rejects.toThrow(message)
    })
  })

  describe('when a session appears between the check and the write', () => {
    const appearDuring = (method: 'cancel' | 'updateWindow') =>
      jest.spyOn(schedules, method).mockImplementationOnce(() => {
        guard.withSessions.add(scheduleId)
        return Promise.resolve(method === 'cancel' ? false : null) as never
      })

    it('refuses the cancel with the session message', async () => {
      appearDuring('cancel')

      await expect(
        new CancelExamScheduleUseCase(schedules, guard).execute(scheduleId),
      ).rejects.toThrow('Jadwal sudah punya sesi dan tidak bisa dibatalkan')
    })

    it('refuses the change with the extend-only message', async () => {
      appearDuring('updateWindow')

      await expect(
        new UpdateExamScheduleUseCase(schedules, guard).execute(scheduleId, {
          startsAt: START,
          endsAt: END,
          durationMinutes: 60,
          type: 'UH',
        }),
      ).rejects.toThrow(
        'Jadwal sudah punya sesi: hanya waktu selesai yang bisa diperpanjang',
      )
    })
  })

  describe('makeups', () => {
    async function withMakeup() {
      const original = (await schedules.findById(scheduleId))!
      const makeup = await schedules.createMakeup({
        packageId: original.packageId,
        classroomId: original.classroomId,
        semesterId: original.semesterId,
        startsAt: new Date('2026-11-03T01:00:00.000Z'),
        endsAt: new Date('2026-11-03T04:00:00.000Z'),
        durationMinutes: 60,
        type: original.type,
        createdById: USER.id,
        makeupOfId: original.id,
        participants: [
          { studentId: 'st1', reason: 'SICK' as const, note: null },
        ],
      })
      return { original, makeup: makeup! }
    }

    const update = (
      id: string,
      fields: Parameters<UpdateExamScheduleUseCase['execute']>[1],
    ) => new UpdateExamScheduleUseCase(schedules, guard).execute(id, fields)

    it('keeps a makeup from opening before the regular exam ends', async () => {
      const { makeup } = await withMakeup()

      await expect(
        update(makeup.id, {
          startsAt: new Date(END.getTime() - 60_000),
          endsAt: new Date('2026-11-03T04:00:00.000Z'),
          durationMinutes: 60,
          type: 'UH',
        }),
      ).rejects.toThrow('Susulan harus dimulai setelah ujian utama berakhir')
    })

    it('keeps the type of a makeup the same as the original', async () => {
      const { makeup } = await withMakeup()

      await expect(
        update(makeup.id, {
          startsAt: makeup.startsAt,
          endsAt: makeup.endsAt,
          durationMinutes: 60,
          type: 'UAS',
        }),
      ).rejects.toThrow('Jenis ujian susulan sama dengan ujian utama')
    })

    it('still lets a makeup move later', async () => {
      const { makeup } = await withMakeup()

      const moved = await update(makeup.id, {
        startsAt: new Date('2026-11-03T02:00:00.000Z'),
        endsAt: new Date('2026-11-03T05:00:00.000Z'),
        durationMinutes: 60,
        type: 'UH',
      })

      expect(moved.startsAt).toEqual(new Date('2026-11-03T02:00:00.000Z'))
    })

    it('refuses to extend the regular exam into a live makeup', async () => {
      await withMakeup()

      await expect(
        update(scheduleId, {
          startsAt: START,
          endsAt: new Date('2026-11-03T02:00:00.000Z'),
          durationMinutes: 90,
          type: 'UH',
        }),
      ).rejects.toThrow('Ujian utama tidak bisa diperpanjang melewati susulan')
      await expect(
        update(scheduleId, {
          startsAt: START,
          endsAt: new Date('2026-11-03T00:30:00.000Z'),
          durationMinutes: 90,
          type: 'UH',
        }),
      ).resolves.toBeDefined()
    })
  })
})

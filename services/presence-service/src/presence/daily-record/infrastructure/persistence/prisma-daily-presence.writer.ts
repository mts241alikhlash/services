import { PrismaService } from '../../../../core/database/prisma.service.js'
import { DailyPresenceEntity } from '../../domain/entities/daily-presence.entity.js'
import {
  CorrectPresenceInput,
  ManualPresenceInput,
  RecordCheckOutInput,
  UpsertCheckInInput,
} from '../../domain/interfaces/daily-presence-repository.interface.js'

export async function upsertCheckIn(
  prisma: PrismaService,
  existing: DailyPresenceEntity | null,
  input: UpsertCheckInInput,
): Promise<DailyPresenceEntity> {
  const {
    userId,
    subjectType,
    date,
    checkInAt,
    status,
    lateMinutes,
    workPatternId,
    source,
  } = input

  if (existing) {
    const onApprovedLeave = existing.leaveRequestId !== null

    return prisma.dailyPresence.update({
      where: { id: existing.id },
      data: {
        checkInAt,
        checkInSource: source,
        workPatternId,
        ...(onApprovedLeave
          ? {}
          : { status, statusSource: source, lateMinutes }),
      },
    })
  }

  return prisma.dailyPresence.create({
    data: {
      userId,
      subjectType,
      date,
      checkInAt,
      checkInSource: source,
      status,
      statusSource: source,
      lateMinutes,
      workPatternId,
    },
  })
}

export async function recordCheckOut(
  prisma: PrismaService,
  input: RecordCheckOutInput,
): Promise<DailyPresenceEntity> {
  const { id, checkOutAt, earlyLeaveMinutes, source } = input

  return prisma.dailyPresence.update({
    where: { id },
    data: { checkOutAt, checkOutSource: source, earlyLeaveMinutes },
  })
}

export async function createManual(
  prisma: PrismaService,
  input: ManualPresenceInput,
): Promise<DailyPresenceEntity> {
  return prisma.dailyPresence.create({
    data: {
      ...input,
      checkInSource: input.checkInAt ? 'MANUAL' : null,
      checkOutSource: input.checkOutAt ? 'MANUAL' : null,
      statusSource: 'MANUAL',
    },
  })
}

export async function correct(
  prisma: PrismaService,
  id: string,
  input: CorrectPresenceInput,
): Promise<DailyPresenceEntity> {
  return prisma.dailyPresence.update({
    where: { id },
    data: {
      ...(input.checkInAt !== undefined && {
        checkInAt: input.checkInAt,
        checkInSource: 'MANUAL',
      }),
      ...(input.checkOutAt !== undefined && {
        checkOutAt: input.checkOutAt,
        checkOutSource: 'MANUAL',
      }),
      ...(input.status !== undefined && {
        status: input.status,
        statusSource: 'MANUAL',
      }),
      ...(input.note !== undefined && { note: input.note }),
    },
  })
}

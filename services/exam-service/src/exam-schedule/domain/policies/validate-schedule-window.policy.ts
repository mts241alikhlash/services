import { BadRequestException } from '@nestjs/common'

export interface ScheduleWindow {
  startsAt: Date
  endsAt: Date
  durationMinutes: number
}

const MS_PER_MINUTE = 60_000
const MS_PER_DAY = 86_400_000
export const MAX_DURATION_MINUTES = 24 * 60
export const MAX_WINDOW_DAYS = 14

export function validateScheduleWindow(window: ScheduleWindow): void {
  const start = window.startsAt.getTime()
  const end = window.endsAt.getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new BadRequestException('Waktu mulai dan selesai harus valid')
  }
  if (end <= start) {
    throw new BadRequestException('Waktu selesai harus setelah waktu mulai')
  }
  if (!Number.isInteger(window.durationMinutes) || window.durationMinutes < 1) {
    throw new BadRequestException('Durasi minimal 1 menit')
  }
  if (window.durationMinutes > MAX_DURATION_MINUTES) {
    throw new BadRequestException('Durasi maksimal 24 jam')
  }
  if (end - start > MAX_WINDOW_DAYS * MS_PER_DAY) {
    throw new BadRequestException('Jendela ujian maksimal 14 hari')
  }
  if (window.durationMinutes * MS_PER_MINUTE > end - start) {
    throw new BadRequestException(
      'Durasi tidak boleh lebih panjang dari jendela ujian',
    )
  }
}

export function assertWindowNotPast(window: { endsAt: Date }, now: Date): void {
  if (window.endsAt.getTime() <= now.getTime()) {
    throw new BadRequestException('Jendela ujian sudah lewat')
  }
}

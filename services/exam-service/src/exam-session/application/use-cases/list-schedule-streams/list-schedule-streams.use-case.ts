import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { ListScheduleSessionsUseCase } from '../list-schedule-sessions/list-schedule-sessions.use-case.js'
import type { ExamSession } from '../../../domain/entities/exam-session.entity.js'

/** A seat is drawn red when its last heartbeat is older than this. */
export const SEAT_STALE_MS = 60 * 1000

export interface ScheduleStreamRow {
  sessionId: string
  studentId: string
  studentName: string | null
  studentNis: string | null
  status: ExamSession['status']
  violationCount: number
  cameraBlocked: string | null
  lastSeenAt: Date | null
  playbackUrl: string | null
}

@Injectable()
export class ListScheduleStreamsUseCase {
  constructor(
    private readonly sessions: ListScheduleSessionsUseCase,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    scheduleId: string,
    now: Date = new Date(),
  ): Promise<ScheduleStreamRow[]> {
    // Every session of the schedule, not one page: the grid shows the whole room.
    const page = await this.sessions.execute(scheduleId, 1, 500)
    const base = this.config
      .get<string>('STREAM_HLS_URL', 'https://stream.invalid')
      .replace(/\/$/, '')

    return Promise.all(
      page.data.map(async (row) => ({
        sessionId: row.id,
        studentId: row.studentId,
        studentName: row.studentName,
        studentNis: row.studentNis,
        status: row.status,
        violationCount: row.violationCount,
        cameraBlocked: row.cameraBlocked,
        lastSeenAt: row.lastSeenAt,
        playbackUrl: await this.playbackUrl(base, row, now),
      })),
    )
  }

  private async playbackUrl(
    base: string,
    row: ExamSession,
    now: Date,
  ): Promise<string | null> {
    if (row.status !== 'IN_PROGRESS') return null
    if (row.lastSeenAt === null) return null
    if (now.getTime() - row.lastSeenAt.getTime() > SEAT_STALE_MS) return null

    // MediaMTX asks the auth hook before serving a segment, so the read needs its
    // own token naming this stream; a publish token must never open a read. The
    // token is minted only after the caller passed `exam-sessions.read`.
    const token = await this.jwt.signAsync(
      { sub: row.id, kind: 'hls-read' },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: 3600,
      },
    )
    return `${base}/${row.id}/index.m3u8?token=${encodeURIComponent(token)}`
  }
}

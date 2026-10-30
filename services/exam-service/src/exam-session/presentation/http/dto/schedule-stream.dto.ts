import { ApiProperty } from '@nestjs/swagger'
import type { ScheduleStreamRow } from '../../../application/use-cases/list-schedule-streams/list-schedule-streams.use-case.js'

export class ScheduleStreamDto {
  @ApiProperty({ format: 'uuid' }) sessionId!: string
  @ApiProperty({ format: 'uuid' }) studentId!: string
  @ApiProperty({ type: String, nullable: true }) studentName!: string | null
  @ApiProperty({ type: String, nullable: true }) studentNis!: string | null
  @ApiProperty({ enum: ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'GRADED'] })
  status!: ScheduleStreamRow['status']
  @ApiProperty() violationCount!: number
  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['network', 'permission', 'battery', 'stopped'],
    description: 'Why the camera is not streaming; null once it streams again',
  })
  cameraBlocked!: string | null
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Last heartbeat; older than 60 s means the seat is drawn red',
  })
  lastSeenAt!: string | null
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'HLS URL, or null when the seat is not streaming',
  })
  playbackUrl!: string | null

  static fromDomain(row: ScheduleStreamRow): ScheduleStreamDto {
    const dto = new ScheduleStreamDto()
    dto.sessionId = row.sessionId
    dto.studentId = row.studentId
    dto.studentName = row.studentName
    dto.studentNis = row.studentNis
    dto.status = row.status
    dto.violationCount = row.violationCount
    dto.cameraBlocked = row.cameraBlocked
    dto.lastSeenAt = row.lastSeenAt?.toISOString() ?? null
    dto.playbackUrl = row.playbackUrl
    return dto
  }
}

export class ScheduleStreamListResponseDto {
  @ApiProperty({ type: () => [ScheduleStreamDto] })
  data!: ScheduleStreamDto[]
  @ApiProperty() total!: number

  static fromDomain(rows: ScheduleStreamRow[]): ScheduleStreamListResponseDto {
    const dto = new ScheduleStreamListResponseDto()
    dto.data = rows.map((row) => ScheduleStreamDto.fromDomain(row))
    dto.total = rows.length
    return dto
  }
}

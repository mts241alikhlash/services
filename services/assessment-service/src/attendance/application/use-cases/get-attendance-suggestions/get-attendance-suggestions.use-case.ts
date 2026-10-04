import { Injectable, Logger } from '@nestjs/common'
import {
  GateSuggestion,
  IDailyPresenceReadPort,
} from '../../../../platform/presence-lookup/presence-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import type { GetAttendanceSuggestionsInput } from './get-attendance-suggestions.input.js'

export interface AttendanceSuggestion {
  enrollmentId: string
  suggestedStatus: 'PRESENT' | 'LATE'
  checkInAt: Date | null
  lateMinutes: number
}

export interface AttendanceSuggestionResult {
  date: string
  suggestions: AttendanceSuggestion[]
  unscannedEnrollmentIds: string[]
  available: boolean
}

@Injectable()
export class GetAttendanceSuggestionsUseCase {
  private readonly logger = new Logger(GetAttendanceSuggestionsUseCase.name)

  constructor(
    private readonly enrollments: IEnrollmentLookupPort,
    private readonly presence: IDailyPresenceReadPort,
  ) {}

  async execute(
    input: GetAttendanceSuggestionsInput,
  ): Promise<AttendanceSuggestionResult> {
    const enrolled = await this.enrollments.listByClassroom(
      input.classroomId,
      input.semesterId,
      1000,
    )

    const byUserId = new Map<string, string>()
    for (const enrollment of enrolled) {
      if (enrollment.studentUserId) {
        byUserId.set(enrollment.studentUserId, enrollment.id)
      }
    }

    const allEnrollmentIds = [...byUserId.values()]
    const date = new Date(input.date)

    let gate: GateSuggestion[]
    try {
      gate = await this.presence.findByUsersAndDate([...byUserId.keys()], date)
    } catch (error) {
      this.logger.warn(
        `Gate suggestions unavailable for classroom ${input.classroomId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      return {
        date: input.date,
        suggestions: [],
        unscannedEnrollmentIds: allEnrollmentIds,
        available: false,
      }
    }

    const suggestions: AttendanceSuggestion[] = []
    const scanned = new Set<string>()

    for (const record of gate) {
      const enrollmentId = byUserId.get(record.userId)
      if (!enrollmentId) continue

      if (record.status !== 'PRESENT' && record.status !== 'LATE') continue

      scanned.add(enrollmentId)
      suggestions.push({
        enrollmentId,
        suggestedStatus: record.status,
        checkInAt: record.checkInAt,
        lateMinutes: record.lateMinutes,
      })
    }

    return {
      date: input.date,
      suggestions,
      unscannedEnrollmentIds: allEnrollmentIds.filter((id) => !scanned.has(id)),
      available: true,
    }
  }
}

import { Injectable } from '@nestjs/common'
import {
  FUTURE_SCAN_TOLERANCE_SECONDS,
  MAX_OFFLINE_WINDOW_HOURS,
} from '../constants/presence.constants.js'

export interface ClockAnchor {
  serverTime: Date
  anchorId: string
  maxOfflineWindowHours: number
}

export type ScanTimeVerdict =
  { accepted: true; occurredAt: Date } | { accepted: false; reason: string }

@Injectable()
export class ServerClockService {
  now(): Date {
    return new Date()
  }

  issueAnchor(): ClockAnchor {
    const serverTime = this.now()
    return {
      serverTime,
      anchorId: crypto.randomUUID(),
      maxOfflineWindowHours: MAX_OFFLINE_WINDOW_HOURS,
    }
  }

  resolveOccurredAt(claimed?: Date | null): ScanTimeVerdict {
    const now = this.now()
    if (!claimed) {
      return { accepted: true, occurredAt: now }
    }

    const driftSeconds = (claimed.getTime() - now.getTime()) / 1000
    if (driftSeconds > FUTURE_SCAN_TOLERANCE_SECONDS) {
      return { accepted: false, reason: 'Scan time is in the future' }
    }

    const ageHours = (now.getTime() - claimed.getTime()) / 3_600_000
    if (ageHours > MAX_OFFLINE_WINDOW_HOURS) {
      return {
        accepted: false,
        reason: `Scan is older than the ${MAX_OFFLINE_WINDOW_HOURS}h offline window`,
      }
    }

    return { accepted: true, occurredAt: claimed }
  }
}

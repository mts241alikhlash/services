import { BadRequestException, Injectable } from '@nestjs/common'
import { MAX_SCAN_BATCH_SIZE } from '../../shared/constants/presence.constants.js'
import { BatchScanResult } from '../domain/entities/scan.entity.js'
import { RecordScanBatchDto } from '../dto/request/record-scan-batch.dto.js'
import { RecordScanUseCase } from './record-scan.use-case.js'

const ACCEPTED_OUTCOMES = new Set(['ACCEPTED', 'DUPLICATE'])

@Injectable()
export class RecordScanBatchUseCase {
  constructor(private readonly recordScan: RecordScanUseCase) {}

  async execute(
    deviceId: string,
    dto: RecordScanBatchDto,
  ): Promise<BatchScanResult[]> {
    if (dto.scans.length > MAX_SCAN_BATCH_SIZE) {
      throw new BadRequestException(
        `Send at most ${MAX_SCAN_BATCH_SIZE} scans per batch`,
      )
    }

    const ordered = [...dto.scans].sort(byOccurredAt)
    const results: BatchScanResult[] = []

    for (const scan of ordered) {
      const result = await this.recordScan.execute(deviceId, scan)
      results.push({
        clientEventId: scan.clientEventId,
        outcome: result.outcome,
        accepted: true,
      })
    }

    return results
  }
}

function byOccurredAt(
  a: { occurredAt?: string },
  b: { occurredAt?: string },
): number {
  if (!a.occurredAt || !b.occurredAt) return 0
  return a.occurredAt.localeCompare(b.occurredAt)
}

export { ACCEPTED_OUTCOMES }

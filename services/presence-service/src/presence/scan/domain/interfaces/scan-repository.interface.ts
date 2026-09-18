import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import { ScanEntity, ScanOutcomeEnum } from '../entities/scan.entity.js'

export interface ScanQueryInput extends PaginationQueryInput {
  deviceId?: string
  credentialId?: string
  outcome?: ScanOutcomeEnum
  dateFrom?: Date
  dateTo?: Date
}

export interface RecordScanRepositoryInput {
  deviceId: string
  credentialId?: string | null
  presentedCode: string
  clientEventId: string
  occurredAt: Date
  outcome: ScanOutcomeEnum
  rejectionReason?: string | null
}

export interface ScanWithDevice extends ScanEntity {
  device: { id: string; name: string }
}

export abstract class IScanRepository {
  abstract findAll(
    query: ScanQueryInput,
  ): Promise<PaginatedResult<ScanWithDevice>>

  abstract findByClientEventId(
    deviceId: string,
    clientEventId: string,
  ): Promise<ScanEntity | null>

  abstract findLastAccepted(credentialId: string): Promise<ScanEntity | null>

  abstract record(input: RecordScanRepositoryInput): Promise<ScanEntity>
}

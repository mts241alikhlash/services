import type { AdmissionDownloadEntity } from '../entities/admission-download.entity.js'

export interface CreateDownloadRecord {
  title: string
  description: string | null
  fileKey: string
  fileName: string
  sizeBytes: number
  sortOrder: number
  isActive: boolean
}

export interface UpdateDownloadRecord {
  title?: string
  description?: string | null
  isActive?: boolean
  fileKey?: string
  fileName?: string
  sizeBytes?: number
}

export abstract class IAdmissionDownloadRepository {
  abstract findAll(): Promise<AdmissionDownloadEntity[]>
  abstract findActive(): Promise<AdmissionDownloadEntity[]>
  abstract findById(id: string): Promise<AdmissionDownloadEntity | null>
  abstract titleTaken(title: string, exceptId?: string): Promise<boolean>
  abstract maxSortOrder(): Promise<number>
  abstract create(input: CreateDownloadRecord): Promise<AdmissionDownloadEntity>
  abstract update(
    id: string,
    input: UpdateDownloadRecord,
  ): Promise<AdmissionDownloadEntity>
  abstract reorder(ids: string[]): Promise<void>
  abstract delete(id: string): Promise<void>
}

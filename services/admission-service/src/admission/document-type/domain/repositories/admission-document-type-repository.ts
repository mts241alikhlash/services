import type { AdmissionDocumentTypeEntity } from '../entities/admission-document-type.entity.js'

export interface CreateDocumentTypeInput {
  name: string
  isRequired: boolean
  isActive: boolean
}

export type UpdateDocumentTypeInput = Partial<CreateDocumentTypeInput>

export type CreateDocumentTypeRecord = CreateDocumentTypeInput & {
  code: string
  sortOrder: number
}

export abstract class IAdmissionDocumentTypeRepository {
  abstract findAll(): Promise<AdmissionDocumentTypeEntity[]>
  abstract findById(id: string): Promise<AdmissionDocumentTypeEntity | null>
  abstract nameTaken(name: string, exceptId?: string): Promise<boolean>
  abstract findAllCodes(): Promise<string[]>
  abstract maxSortOrder(): Promise<number>
  abstract create(
    input: CreateDocumentTypeRecord,
  ): Promise<AdmissionDocumentTypeEntity>
  abstract update(
    id: string,
    input: UpdateDocumentTypeInput,
  ): Promise<AdmissionDocumentTypeEntity>
  abstract reorder(ids: string[]): Promise<void>
  abstract delete(id: string): Promise<void>
}

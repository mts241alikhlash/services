import type {
  AdmissionDocumentTypeEntity,
  DocumentRequirement,
} from '../entities/admission-document-type.entity.js'

export interface CreateDocumentTypeInput {
  name: string
  requirement?: DocumentRequirement
  isRequired?: boolean
  lateDueMonths?: number | null
  isActive: boolean
}

export interface UpdateDocumentTypeInput {
  name?: string
  requirement?: DocumentRequirement
  isRequired?: boolean
  lateDueMonths?: number | null
  isActive?: boolean
}

export interface CreateDocumentTypeRecord {
  name: string
  code: string
  requirement: DocumentRequirement
  lateDueMonths: number | null
  isActive: boolean
  sortOrder: number
}

export type UpdateDocumentTypeRecord = Omit<
  UpdateDocumentTypeInput,
  'isRequired'
>

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
    input: UpdateDocumentTypeRecord,
  ): Promise<AdmissionDocumentTypeEntity>
  abstract reorder(ids: string[]): Promise<void>
  abstract delete(id: string): Promise<void>
}

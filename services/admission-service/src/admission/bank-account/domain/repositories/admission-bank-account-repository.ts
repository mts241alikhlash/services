import type { AdmissionBankAccountEntity } from '../entities/admission-bank-account.entity.js'

export interface SaveAdmissionBankAccountInput {
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  sortOrder?: number
  isActive?: boolean
}

export abstract class IAdmissionBankAccountRepository {
  abstract findAll(query: {
    activeOnly: boolean
  }): Promise<AdmissionBankAccountEntity[]>
  abstract findById(id: string): Promise<AdmissionBankAccountEntity | null>
  abstract create(
    input: SaveAdmissionBankAccountInput &
      Pick<
        AdmissionBankAccountEntity,
        'bankName' | 'accountNumber' | 'accountHolder'
      >,
  ): Promise<AdmissionBankAccountEntity>
  abstract update(
    id: string,
    input: SaveAdmissionBankAccountInput,
  ): Promise<AdmissionBankAccountEntity>
  abstract softDelete(id: string): Promise<AdmissionBankAccountEntity>
}

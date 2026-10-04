export interface AdmissionBankAccountEntity {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

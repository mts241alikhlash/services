import { Injectable, NotFoundException } from '@nestjs/common'
import {
  IAdmissionBankAccountRepository,
  type SaveAdmissionBankAccountInput,
} from '../../../domain/repositories/admission-bank-account-repository.js'

function trimmed(input: SaveAdmissionBankAccountInput) {
  return {
    ...input,
    ...(input.bankName !== undefined && { bankName: input.bankName.trim() }),
    ...(input.accountNumber !== undefined && {
      accountNumber: input.accountNumber.trim(),
    }),
    ...(input.accountHolder !== undefined && {
      accountHolder: input.accountHolder.trim(),
    }),
  }
}

@Injectable()
export class SaveBankAccountUseCase {
  constructor(private readonly repository: IAdmissionBankAccountRepository) {}

  create(
    input: SaveAdmissionBankAccountInput & {
      bankName: string
      accountNumber: string
      accountHolder: string
    },
  ) {
    return this.repository.create({
      ...input,
      bankName: input.bankName.trim(),
      accountNumber: input.accountNumber.trim(),
      accountHolder: input.accountHolder.trim(),
    })
  }

  async update(id: string, input: SaveAdmissionBankAccountInput) {
    if (!(await this.repository.findById(id))) {
      throw new NotFoundException('Rekening tidak ditemukan')
    }
    return this.repository.update(id, trimmed(input))
  }
}

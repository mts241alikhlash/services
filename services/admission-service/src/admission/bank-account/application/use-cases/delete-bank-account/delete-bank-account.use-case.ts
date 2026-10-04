import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionBankAccountRepository } from '../../../domain/repositories/admission-bank-account-repository.js'

@Injectable()
export class DeleteBankAccountUseCase {
  constructor(private readonly repository: IAdmissionBankAccountRepository) {}

  async execute(id: string) {
    if (!(await this.repository.findById(id))) {
      throw new NotFoundException('Rekening tidak ditemukan')
    }
    return this.repository.softDelete(id)
  }
}

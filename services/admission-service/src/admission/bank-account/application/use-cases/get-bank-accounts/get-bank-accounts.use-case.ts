import { Injectable } from '@nestjs/common'
import { IAdmissionBankAccountRepository } from '../../../domain/repositories/admission-bank-account-repository.js'

@Injectable()
export class GetBankAccountsUseCase {
  constructor(private readonly repository: IAdmissionBankAccountRepository) {}

  execute(query: { activeOnly?: boolean } = {}) {
    return this.repository.findAll({ activeOnly: query.activeOnly ?? false })
  }
}

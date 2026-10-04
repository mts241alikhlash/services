import { Injectable } from '@nestjs/common'
import {
  OPTION_LISTS,
  type OptionListKey,
  type OptionRef,
} from '../../../../../platform/reference-lookup/option-lists.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { IAdmissionBankAccountRepository } from '../../../../bank-account/index.js'

export interface FormBankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
}

export type FormOptions = Record<OptionListKey | 'religions', OptionRef[]> & {
  bankAccounts: FormBankAccount[]
}

@Injectable()
export class GetFormOptionsUseCase {
  constructor(
    private readonly lookup: IReferenceLookupPort,
    private readonly bankAccounts: IAdmissionBankAccountRepository,
  ) {}

  async execute(): Promise<FormOptions> {
    const keys = Object.keys(OPTION_LISTS) as OptionListKey[]
    const [accounts, religions, ...lists] = await Promise.all([
      this.bankAccounts.findAll({ activeOnly: true }),
      this.lookup.activeReligions(),
      ...keys.map((key) => this.lookup.activeOptions(key)),
    ])
    return {
      ...(Object.fromEntries(
        keys.map((key, index) => [key, lists[index]]),
      ) as Record<OptionListKey, OptionRef[]>),
      religions,
      bankAccounts: accounts.map(
        ({ id, bankName, accountNumber, accountHolder }) => ({
          id,
          bankName,
          accountNumber,
          accountHolder,
        }),
      ),
    }
  }
}

import {
  OPTION_LISTS,
  type OptionListKey,
} from '../../../../../platform/reference-lookup/option-lists.js'
import type { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { GetFormOptionsUseCase } from './get-form-options.use-case.js'
import type { IAdmissionBankAccountRepository } from '../../../../bank-account/index.js'

describe('GetFormOptionsUseCase', () => {
  it('returns every option list and the religions, asking once per list', async () => {
    const activeReligions = jest
      .fn()
      .mockResolvedValue([{ id: 'r1', name: 'Islam', isActive: true }])
    const activeOptions = jest
      .fn()
      .mockImplementation((key: OptionListKey) =>
        Promise.resolve([{ id: `${key}-1`, name: key, isActive: true }]),
      )
    const findAll = jest.fn().mockResolvedValue([
      {
        id: 'acc-1',
        bankName: 'BSI',
        accountNumber: '7123456789',
        accountHolder: 'MTs Al-Ikhlash',
        sortOrder: 0,
        isActive: true,
      },
    ])
    const useCase = new GetFormOptionsUseCase(
      { activeOptions, activeReligions } as unknown as IReferenceLookupPort,
      { findAll } as unknown as IAdmissionBankAccountRepository,
    )

    const result = await useCase.execute()

    const keys = Object.keys(OPTION_LISTS)
    expect(keys).toHaveLength(17)
    expect(Object.keys(result).sort()).toEqual(
      [...keys, 'religions', 'bankAccounts'].sort(),
    )
    expect(findAll).toHaveBeenCalledWith({ activeOnly: true })
    expect(result.bankAccounts).toEqual([
      {
        id: 'acc-1',
        bankName: 'BSI',
        accountNumber: '7123456789',
        accountHolder: 'MTs Al-Ikhlash',
      },
    ])
    expect(activeOptions).toHaveBeenCalledTimes(17)
    expect(result.religions).toEqual([
      { id: 'r1', name: 'Islam', isActive: true },
    ])
    expect(result.transportations).toEqual([
      { id: 'transportations-1', name: 'transportations', isActive: true },
    ])
  })
})

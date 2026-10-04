import { NotFoundException } from '@nestjs/common'
import { SaveBankAccountUseCase } from './save-bank-account/save-bank-account.use-case.js'
import { DeleteBankAccountUseCase } from './delete-bank-account/delete-bank-account.use-case.js'
import { GetBankAccountsUseCase } from './get-bank-accounts/get-bank-accounts.use-case.js'

const account = {
  id: 'acc-1',
  bankName: 'BSI',
  accountNumber: '7123456789',
  accountHolder: 'MTs Al-Ikhlash',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-10-04T00:00:00.000Z'),
  updatedAt: new Date('2026-10-04T00:00:00.000Z'),
}

function repository(found: typeof account | null = account) {
  return {
    findAll: jest.fn().mockResolvedValue([account]),
    findById: jest.fn().mockResolvedValue(found),
    create: jest.fn().mockResolvedValue(account),
    update: jest.fn().mockResolvedValue(account),
    softDelete: jest.fn().mockResolvedValue(account),
  }
}

describe('bank account use cases', () => {
  it('lists every account for the admin and only active ones for the form', async () => {
    const repo = repository()
    const useCase = new GetBankAccountsUseCase(repo)

    await useCase.execute()
    await useCase.execute({ activeOnly: true })

    expect(repo.findAll.mock.calls).toEqual([
      [{ activeOnly: false }],
      [{ activeOnly: true }],
    ])
  })

  it('creates an account with trimmed text', async () => {
    const repo = repository()
    const useCase = new SaveBankAccountUseCase(repo)

    await useCase.create({
      bankName: ' BSI ',
      accountNumber: ' 7123456789 ',
      accountHolder: ' MTs Al-Ikhlash ',
    })

    expect(repo.create).toHaveBeenCalledWith({
      bankName: 'BSI',
      accountNumber: '7123456789',
      accountHolder: 'MTs Al-Ikhlash',
    })
  })

  it('refuses to update or delete an account that does not exist', async () => {
    const repo = repository(null)
    const save = new SaveBankAccountUseCase(repo)
    const remove = new DeleteBankAccountUseCase(repo)

    await expect(save.update('x', { isActive: false })).rejects.toThrow(
      NotFoundException,
    )
    await expect(remove.execute('x')).rejects.toThrow(NotFoundException)
    expect(repo.update).not.toHaveBeenCalled()
    expect(repo.softDelete).not.toHaveBeenCalled()
  })

  it('soft-deletes an account so past payments keep it', async () => {
    const repo = repository()
    const remove = new DeleteBankAccountUseCase(repo)

    await remove.execute('acc-1')

    expect(repo.softDelete).toHaveBeenCalledWith('acc-1')
  })
})

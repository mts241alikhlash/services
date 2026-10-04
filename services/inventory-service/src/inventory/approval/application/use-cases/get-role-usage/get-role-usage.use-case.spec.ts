import { IApprovalRepository } from '../../../domain/repositories/approval.repository.js'
import { GetRoleUsageUseCase } from './get-role-usage.use-case.js'

const step = (approverRoleCode: string) => ({ approverRoleCode })

describe('GetRoleUsageUseCase', () => {
  it('counts the active steps each role approves, with their workflows', async () => {
    const repository = {
      findAllWorkflows: jest.fn().mockResolvedValue([
        {
          name: 'Peminjaman',
          isActive: true,
          steps: [step('HEAD_OF_ADMINISTRATION'), step('PRINCIPAL')],
        },
        {
          name: 'Pengadaan',
          isActive: true,
          steps: [step('PRINCIPAL'), step('PRINCIPAL')],
        },
        { name: 'Lama', isActive: false, steps: [step('OPERATOR')] },
        { name: 'Kosong', isActive: true },
      ]),
    } as unknown as IApprovalRepository

    await expect(
      new GetRoleUsageUseCase(repository).execute(),
    ).resolves.toEqual([
      {
        roleCode: 'HEAD_OF_ADMINISTRATION',
        steps: 1,
        workflows: ['Peminjaman'],
      },
      {
        roleCode: 'PRINCIPAL',
        steps: 3,
        workflows: ['Peminjaman', 'Pengadaan'],
      },
    ])
  })
})

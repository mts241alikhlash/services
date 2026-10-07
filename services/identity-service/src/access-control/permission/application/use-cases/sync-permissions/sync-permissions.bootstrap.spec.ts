import { SyncPermissionsUseCase } from './sync-permissions.use-case.js'
import { PermissionModule } from '../../../permission.module.js'
import { EnsureStructuralRolesUseCase } from '../../../../role/application/use-cases/ensure-structural-roles/ensure-structural-roles.use-case.js'
import { SYSTEM_PERMISSIONS } from '../../../constants/permission-codes.constants.js'
import type { IPermissionRepository } from '../../../domain/repositories/permission.repository.js'

describe('permission catalogue sync on bootstrap', () => {
  function useCaseWithSpy() {
    const upsertPermission = jest.fn().mockResolvedValue(undefined)
    const repository = { upsertPermission } as unknown as IPermissionRepository
    return {
      useCase: new SyncPermissionsUseCase(repository),
      upsertPermission,
    }
  }

  it('upserts every code the catalogue declares', async () => {
    const { useCase, upsertPermission } = useCaseWithSpy()

    await useCase.execute()

    expect(upsertPermission).toHaveBeenCalledTimes(SYSTEM_PERMISSIONS.length)
  })

  it('is idempotent: a second run asks for the same rows', async () => {
    const { useCase, upsertPermission } = useCaseWithSpy()

    await useCase.execute()
    const first = upsertPermission.mock.calls.map((c) => c[0])
    upsertPermission.mockClear()

    await useCase.execute()
    const second = upsertPermission.mock.calls.map((c) => c[0])

    expect(second).toEqual(first)
  })

  it('runs when the application boots', async () => {
    const { useCase, upsertPermission } = useCaseWithSpy()
    const ensureStructuralRoles = {
      execute: jest.fn().mockResolvedValue(undefined),
    }
    const module = new PermissionModule(
      useCase,
      ensureStructuralRoles as unknown as EnsureStructuralRolesUseCase,
    )

    await module.onApplicationBootstrap()

    expect(upsertPermission).toHaveBeenCalled()
    expect(ensureStructuralRoles.execute).toHaveBeenCalled()
  })

  it('carries the self-service codes', () => {
    const codes = SYSTEM_PERMISSIONS.map((p) => p.code)

    for (const code of [
      'students.read-own',
      'attendances.read-own',
      'report-cards.read-own',
      'student-scores.read-own',
      'schedules.read-own',
      'employees.read-own',
      'leave-requests.create',
      'leave-requests.read-own',
      'payroll-payslips.read-own',
      'presence-records.read-own',
    ]) {
      expect(codes).toContain(code)
    }
  })
})

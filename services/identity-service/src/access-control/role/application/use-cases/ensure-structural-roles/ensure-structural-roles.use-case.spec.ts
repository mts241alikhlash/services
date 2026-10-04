import { ForbiddenException } from '@nestjs/common'
import { EnsureStructuralRolesUseCase } from './ensure-structural-roles.use-case.js'
import { DeleteRoleUseCase } from '../delete-role/delete-role.use-case.js'
import {
  STRUCTURAL_ROLES,
  isStructuralRole,
} from '../../../domain/policies/structural-roles.policy.js'
import type { IRoleRepository } from '../../../domain/repositories/role.repository.js'

describe('structural roles', () => {
  function repositoryWith(
    existing: Record<string, { id: string; isSystem: boolean }>,
  ) {
    const createStructural = jest.fn().mockResolvedValue({ id: 'new' })
    const markSystem = jest.fn().mockResolvedValue({ id: 'x' })
    const findByCode = jest
      .fn()
      .mockImplementation((code: string) =>
        Promise.resolve(existing[code] ? { code, ...existing[code] } : null),
      )

    const repository = {
      findByCode,
      createStructural,
      markSystem,
    } as unknown as IRoleRepository

    return {
      useCase: new EnsureStructuralRolesUseCase(repository),
      createStructural,
      markSystem,
    }
  }

  it('creates every role the code resolves, on an empty database', async () => {
    const { useCase, createStructural } = repositoryWith({})

    await useCase.execute()

    expect(createStructural).toHaveBeenCalledTimes(STRUCTURAL_ROLES.length)
  })

  it('grants no permissions when it creates one', async () => {
    const { useCase, createStructural } = repositoryWith({})

    await useCase.execute()

    for (const call of createStructural.mock.calls) {
      expect(call[0]).not.toHaveProperty('permissionIds')
      expect(Object.keys(call[0]).sort()).toEqual([
        'code',
        'description',
        'name',
      ])
    }
  })

  it('leaves an existing, already-protected role alone', async () => {
    const existing = Object.fromEntries(
      STRUCTURAL_ROLES.map((r) => [r.code, { id: r.code, isSystem: true }]),
    )
    const { useCase, createStructural, markSystem } = repositoryWith(existing)

    await useCase.execute()

    expect(createStructural).not.toHaveBeenCalled()
    expect(markSystem).not.toHaveBeenCalled()
  })

  it('protects an existing role whose flag was left false', async () => {
    const { useCase, markSystem } = repositoryWith({
      TEACHER: { id: 'role-teacher', isSystem: false },
    })

    await useCase.execute()

    expect(markSystem).toHaveBeenCalledWith('role-teacher')
  })

  describe('deletion', () => {
    function deleteUseCaseFor(role: { code: string; isSystem: boolean }) {
      const repository = {
        findById: jest.fn().mockResolvedValue({ id: 'r1', ...role }),
        delete: jest.fn(),
      } as unknown as IRoleRepository
      return {
        useCase: new DeleteRoleUseCase(repository),
        remove: (repository as unknown as { delete: jest.Mock }).delete,
      }
    }

    it('refuses a structural role even when its flag says otherwise', async () => {
      const { useCase, remove } = deleteUseCaseFor({
        code: 'TEACHER',
        isSystem: false,
      })

      await expect(useCase.execute('r1')).rejects.toThrow(ForbiddenException)
      expect(remove).not.toHaveBeenCalled()
    })

    it('still allows a role the school invented', async () => {
      const { useCase, remove } = deleteUseCaseFor({
        code: 'SARPRAS',
        isSystem: false,
      })

      await useCase.execute('r1')
      expect(remove).toHaveBeenCalledWith('r1')
    })
  })

  it('knows which codes are structural', () => {
    expect(isStructuralRole('TEACHER')).toBe(true)
    expect(isStructuralRole('APPLICANT')).toBe(true)
    expect(isStructuralRole('SARPRAS')).toBe(false)
  })
})

import { ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ExecutionContext } from '@nestjs/common'
import { PermissionGuard } from './permission.guard.js'

describe('PermissionGuard', () => {
  const repo = {
    findUserRoles: jest.fn(),
    findUserPermissions: jest.fn(),
  }
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector

  const guard = new PermissionGuard(reflector, repo as never)

  function contextFor(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'students.read',
    ])
  })

  describe('when the token carries grants', () => {
    it('admits without touching the database', async () => {
      const context = contextFor({
        id: 'u1',
        roles: ['TEACHER'],
        permissions: ['students.read'],
      })

      await expect(guard.canActivate(context)).resolves.toBe(true)
      expect(repo.findUserRoles).not.toHaveBeenCalled()
      expect(repo.findUserPermissions).not.toHaveBeenCalled()
    })

    it('refuses without touching the database', async () => {
      const context = contextFor({
        id: 'u1',
        roles: ['TEACHER'],
        permissions: ['students.read-own'],
      })

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      )
      expect(repo.findUserPermissions).not.toHaveBeenCalled()
    })

    it('bypasses on SUPER_ADMIN with no permission list at all', async () => {
      const context = contextFor({ id: 'u1', roles: ['SUPER_ADMIN'] })

      await expect(guard.canActivate(context)).resolves.toBe(true)
      expect(repo.findUserPermissions).not.toHaveBeenCalled()
    })
  })

  describe('when the token does not', () => {
    it('falls back to the database for both roles and permissions', async () => {
      repo.findUserRoles.mockResolvedValue([{ role: { code: 'TEACHER' } }])
      repo.findUserPermissions.mockResolvedValue(['students.read'])

      await expect(guard.canActivate(contextFor({ id: 'u1' }))).resolves.toBe(
        true,
      )
      expect(repo.findUserRoles).toHaveBeenCalledWith('u1')
      expect(repo.findUserPermissions).toHaveBeenCalledWith('u1')
    })

    it('reads permissions from the database when only roles are on the token', async () => {
      repo.findUserPermissions.mockResolvedValue(['students.read'])

      const context = contextFor({ id: 'u1', roles: ['TEACHER'] })

      await expect(guard.canActivate(context)).resolves.toBe(true)
      expect(repo.findUserRoles).not.toHaveBeenCalled()
      expect(repo.findUserPermissions).toHaveBeenCalledWith('u1')
    })
  })

  it('lets an unguarded route through untouched', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined)

    await expect(guard.canActivate(contextFor(undefined))).resolves.toBe(true)
    expect(repo.findUserRoles).not.toHaveBeenCalled()
  })

  it('refuses an unauthenticated caller on a guarded route', async () => {
    await expect(guard.canActivate(contextFor(undefined))).rejects.toThrow(
      ForbiddenException,
    )
  })
})

import { PrismaEmployeeIdentityReadPort } from '../../infrastructure/persistence/prisma/prisma-employee-identity.read-port.js'
import type { PrismaService } from '../../../core/database/prisma.service.js'

describe('IEmployeeIdentityReadPort', () => {
  function employeePortWith(row: { id: string } | null) {
    const findFirst = jest.fn().mockResolvedValue(row)
    const prisma = { employee: { findFirst } } as unknown as PrismaService
    return { port: new PrismaEmployeeIdentityReadPort(prisma), findFirst }
  }

  describe('employee', () => {
    it('resolves an account to its employee id', async () => {
      const { port } = employeePortWith({ id: 'tea-1' })
      await expect(port.findEmployeeIdByUserId('user-1')).resolves.toBe('tea-1')
    })

    it('returns null for an account with no teaching record', async () => {
      const { port } = employeePortWith(null)
      await expect(port.findEmployeeIdByUserId('user-1')).resolves.toBeNull()
    })

    it('excludes soft-deleted employees from the lookup', async () => {
      const { port, findFirst } = employeePortWith(null)
      await port.findEmployeeIdByUserId('user-1')

      expect(findFirst.mock.calls[0][0].where).toEqual({
        userId: 'user-1',
        deletedAt: null,
      })
    })

    it('selects the id alone', async () => {
      const { port, findFirst } = employeePortWith({ id: 'tea-1' })
      await port.findEmployeeIdByUserId('user-1')

      expect(findFirst.mock.calls[0][0].select).toEqual({ id: true })
    })
  })

  describe('roster', () => {
    function rosterPortWith(rows: { userId: string }[]) {
      const findMany = jest.fn().mockResolvedValue(rows)
      const prisma = { employee: { findMany } } as unknown as PrismaService
      return { port: new PrismaEmployeeIdentityReadPort(prisma), findMany }
    }

    it('returns user ids and nothing else', async () => {
      const { port } = rosterPortWith([{ userId: 'u-1' }, { userId: 'u-2' }])
      await expect(port.listRosterUserIds()).resolves.toEqual(['u-1', 'u-2'])
    })

    it('excludes soft-deleted employees', async () => {
      const { port, findMany } = rosterPortWith([])
      await port.listRosterUserIds()

      expect(findMany.mock.calls[0][0].where).toEqual({ deletedAt: null })
    })

    it('does not narrow by position, category, or employment type', async () => {
      const { port, findMany } = rosterPortWith([])
      await port.listRosterUserIds()

      const where = findMany.mock.calls[0][0].where as Record<string, unknown>
      for (const forbidden of [
        'position',
        'positionId',
        'positionCategory',
        'positionCategoryId',
        'employeePosition',
        'employmentType',
        'employmentTypeId',
      ]) {
        expect(where).not.toHaveProperty(forbidden)
      }
    })

    it('selects the user id alone', async () => {
      const { port, findMany } = rosterPortWith([])
      await port.listRosterUserIds()

      expect(findMany.mock.calls[0][0].select).toEqual({ userId: true })
    })
  })
})

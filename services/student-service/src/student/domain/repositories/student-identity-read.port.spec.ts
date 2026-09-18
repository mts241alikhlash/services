import { PrismaStudentIdentityReadPort } from '../../infrastructure/persistence/prisma/prisma-student-identity.read-port.js'
import type { PrismaService } from '../../../core/database/prisma.service.js'

describe('identity read ports', () => {
  function studentPortWith(row: { id: string } | null) {
    const findFirst = jest.fn().mockResolvedValue(row)
    const prisma = { student: { findFirst } } as unknown as PrismaService
    return { port: new PrismaStudentIdentityReadPort(prisma), findFirst }
  }

  describe('student', () => {
    it('resolves an account to its student id', async () => {
      const { port } = studentPortWith({ id: 'stu-1' })
      await expect(port.findStudentIdByUserId('user-1')).resolves.toBe('stu-1')
    })

    it('returns null for an account with no student record', async () => {
      const { port } = studentPortWith(null)
      await expect(port.findStudentIdByUserId('user-1')).resolves.toBeNull()
    })

    it('excludes soft-deleted students from the lookup', async () => {
      const { port, findFirst } = studentPortWith(null)
      await port.findStudentIdByUserId('user-1')

      expect(findFirst.mock.calls[0][0].where).toEqual({
        userId: 'user-1',
        deletedAt: null,
      })
    })

    it('selects the id alone', async () => {
      const { port, findFirst } = studentPortWith({ id: 'stu-1' })
      await port.findStudentIdByUserId('user-1')

      expect(findFirst.mock.calls[0][0].select).toEqual({ id: true })
    })
  })
})

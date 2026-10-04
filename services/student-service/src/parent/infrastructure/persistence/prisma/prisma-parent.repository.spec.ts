import { PrismaParentRepository } from './prisma-parent.repository.js'

describe('PrismaParentRepository.findAll', () => {
  it('returns how many live children each parent has, which the parent list shows', async () => {
    const row = {
      id: 'par-1',
      name: 'Budi',
      occupationId: 'occ-1',
      educationId: null,
      _count: { studentParents: 2 },
    }
    const prisma = {
      parent: {
        findMany: jest.fn().mockResolvedValue([row]),
        count: jest.fn().mockResolvedValue(1),
      },
    }
    const academicLookup = {
      listOccupationsByIds: jest.fn().mockResolvedValue([]),
      listEducationsByIds: jest.fn().mockResolvedValue([]),
    }
    const repository = new PrismaParentRepository(
      prisma as never,
      academicLookup as never,
    )

    const result = await repository.findAll({})

    expect(prisma.parent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          _count: {
            select: { studentParents: { where: { deletedAt: null } } },
          },
        },
      }),
    )
    expect(result.data[0]._count).toEqual({ studentParents: 2 })
  })
})

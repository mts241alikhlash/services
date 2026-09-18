import type { PrismaService } from '../../../../../../core/database/prisma.service.js'
import { PrismaLocationRepository } from './prisma-location.repository.js'

describe('PrismaLocationRepository', () => {
  const prismaLocation = {
    id: 'location-1',
    code: 'LOC-LAB',
    name: 'Laboratorium',
    building: 'Gedung A',
    room: 'R-08',
    rack: 'Rak 3',
    description: 'Ruang laboratorium',
    createdAt: new Date('2026-09-13T00:00:00.000Z'),
    legacyField: 'must not escape adapter',
  }

  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([prismaLocation])
    const findUnique = jest.fn().mockResolvedValue(prismaLocation)
    const create = jest.fn().mockResolvedValue(prismaLocation)
    const update = jest.fn().mockResolvedValue(prismaLocation)
    const deleteLocation = jest.fn().mockResolvedValue(prismaLocation)
    const prisma = {
      inventoryLocation: {
        findMany,
        findUnique,
        create,
        update,
        delete: deleteLocation,
      },
    } as unknown as PrismaService

    return {
      repository: new PrismaLocationRepository(prisma),
      findMany,
      findUnique,
      create,
      update,
      deleteLocation,
    }
  }

  it('searches code and name case-insensitively and orders names ascending', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany('lab')

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { code: { contains: 'lab', mode: 'insensitive' } },
          { name: { contains: 'lab', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    })
  })

  it('orders location names ascending without a search term', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany()

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: 'asc' },
    })
  })

  it('maps every persisted field in list output', async () => {
    const { repository } = repositoryWithSpies()

    await expect(repository.findMany()).resolves.toEqual([
      {
        id: prismaLocation.id,
        code: prismaLocation.code,
        name: prismaLocation.name,
        building: prismaLocation.building,
        room: prismaLocation.room,
        rack: prismaLocation.rack,
        description: prismaLocation.description,
        createdAt: prismaLocation.createdAt,
      },
    ])
  })

  it('finds by id and maps every persisted field', async () => {
    const { repository, findUnique } = repositoryWithSpies()

    await expect(repository.findById(prismaLocation.id)).resolves.toEqual({
      id: prismaLocation.id,
      code: prismaLocation.code,
      name: prismaLocation.name,
      building: prismaLocation.building,
      room: prismaLocation.room,
      rack: prismaLocation.rack,
      description: prismaLocation.description,
      createdAt: prismaLocation.createdAt,
    })
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: prismaLocation.id },
    })
  })

  it('returns null when id lookup finds no row', async () => {
    const { repository, findUnique } = repositoryWithSpies()
    findUnique.mockResolvedValue(null)

    await expect(repository.findById('missing')).resolves.toBeNull()
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'missing' } })
  })

  it('maps create input explicitly', async () => {
    const { repository, create } = repositoryWithSpies()
    const data = {
      code: 'LOC-WAREHOUSE',
      name: 'Gudang',
      building: 'Gedung B',
      room: '301',
      rack: 'R1',
      description: 'Penyimpanan',
    }

    await expect(repository.create(data)).resolves.toEqual({
      id: prismaLocation.id,
      code: prismaLocation.code,
      name: prismaLocation.name,
      building: prismaLocation.building,
      room: prismaLocation.room,
      rack: prismaLocation.rack,
      description: prismaLocation.description,
      createdAt: prismaLocation.createdAt,
    })

    expect(create).toHaveBeenCalledWith({ data })
  })

  it('maps update input explicitly', async () => {
    const { repository, update } = repositoryWithSpies()
    const data = {
      code: 'LOC-WAREHOUSE',
      name: 'Gudang',
      building: 'Gedung B',
      room: '301',
      rack: 'R1',
      description: 'Penyimpanan',
    }

    await expect(repository.update(prismaLocation.id, data)).resolves.toEqual({
      id: prismaLocation.id,
      code: prismaLocation.code,
      name: prismaLocation.name,
      building: prismaLocation.building,
      room: prismaLocation.room,
      rack: prismaLocation.rack,
      description: prismaLocation.description,
      createdAt: prismaLocation.createdAt,
    })

    expect(update).toHaveBeenCalledWith({
      where: { id: prismaLocation.id },
      data,
    })
  })

  it('deletes by id', async () => {
    const { repository, deleteLocation } = repositoryWithSpies()

    await expect(repository.delete(prismaLocation.id)).resolves.toEqual({
      id: prismaLocation.id,
      code: prismaLocation.code,
      name: prismaLocation.name,
      building: prismaLocation.building,
      room: prismaLocation.room,
      rack: prismaLocation.rack,
      description: prismaLocation.description,
      createdAt: prismaLocation.createdAt,
    })

    expect(deleteLocation).toHaveBeenCalledWith({
      where: { id: prismaLocation.id },
    })
  })

  it('propagates Prisma errors', async () => {
    const { repository, findMany, findUnique, create, update, deleteLocation } =
      repositoryWithSpies()
    const error = new Error('database unavailable')

    findMany.mockRejectedValue(error)
    findUnique.mockRejectedValue(error)
    create.mockRejectedValue(error)
    update.mockRejectedValue(error)
    deleteLocation.mockRejectedValue(error)

    await expect(repository.findMany()).rejects.toBe(error)
    await expect(repository.findById(prismaLocation.id)).rejects.toBe(error)
    await expect(
      repository.create({ code: 'LOC-A', name: 'Lab' }),
    ).rejects.toBe(error)
    await expect(
      repository.update(prismaLocation.id, { name: 'Lab' }),
    ).rejects.toBe(error)
    await expect(repository.delete(prismaLocation.id)).rejects.toBe(error)
  })
})

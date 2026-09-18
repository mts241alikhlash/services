import { NotFoundException } from '@nestjs/common'
import { ILocationRepository } from '../../domain/repositories/location.repository.js'
import { CreateLocationUseCase } from './create-location/create-location.use-case.js'
import { DeleteLocationUseCase } from './delete-location/delete-location.use-case.js'
import { GetLocationsUseCase } from './get-locations/get-locations.use-case.js'
import { UpdateLocationUseCase } from './update-location/update-location.use-case.js'

describe('location use cases', () => {
  const location = {
    id: 'location-1',
    code: 'LOC-LAB',
    name: 'Laboratorium',
    building: null,
    room: null,
    rack: null,
    description: null,
    createdAt: new Date(),
  }

  function makeRepository() {
    return {
      findMany: jest.fn().mockResolvedValue([location]),
      findById: jest.fn().mockResolvedValue(location),
      create: jest.fn().mockResolvedValue(location),
      update: jest.fn().mockResolvedValue(location),
      delete: jest.fn().mockResolvedValue(location),
    } as unknown as jest.Mocked<ILocationRepository>
  }

  it('maps create input and returns created location', async () => {
    const repository = makeRepository()
    const useCase = new CreateLocationUseCase(repository)
    const input = {
      code: 'LOC-LAB',
      name: 'Laboratorium',
      building: undefined,
      room: undefined,
      rack: undefined,
      description: undefined,
      ignored: 'field',
    }

    await expect(useCase.execute(input)).resolves.toBe(location)
    expect(repository.create).toHaveBeenCalledWith({
      code: input.code,
      name: input.name,
      building: null,
      room: null,
      rack: null,
      description: null,
    })
  })

  it('forwards search and returns locations', async () => {
    const repository = makeRepository()
    const useCase = new GetLocationsUseCase(repository)

    await expect(useCase.execute('lab')).resolves.toEqual([location])
    expect(repository.findMany).toHaveBeenCalledWith('lab')
  })

  it('propagates repository errors', async () => {
    const repository = makeRepository()
    const error = new Error('database unavailable')
    repository.findMany.mockRejectedValue(error)
    const useCase = new GetLocationsUseCase(repository)

    await expect(useCase.execute()).rejects.toBe(error)
  })

  it('rejects update when location does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new UpdateLocationUseCase(repository)

    await expect(
      useCase.execute('missing', { name: 'Gudang' }),
    ).rejects.toEqual(
      new NotFoundException('Location with ID missing not found'),
    )
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('maps update input and returns updated location', async () => {
    const repository = makeRepository()
    const useCase = new UpdateLocationUseCase(repository)
    const input = {
      code: 'LOC-WAREHOUSE',
      name: 'Gudang',
      building: 'B',
      room: '301',
      rack: 'R1',
      description: undefined,
      ignored: 'field',
    }

    await expect(useCase.execute(location.id, input)).resolves.toBe(location)
    expect(repository.update).toHaveBeenCalledWith(location.id, {
      code: input.code,
      name: input.name,
      building: input.building,
      room: input.room,
      rack: input.rack,
      description: null,
    })
  })

  it('rejects delete when location does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new DeleteLocationUseCase(repository)

    await expect(useCase.execute('missing')).rejects.toEqual(
      new NotFoundException('Location with ID missing not found'),
    )
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('deletes existing location and returns repository result', async () => {
    const repository = makeRepository()
    const useCase = new DeleteLocationUseCase(repository)

    await expect(useCase.execute(location.id)).resolves.toBe(location)
    expect(repository.delete).toHaveBeenCalledWith(location.id)
  })
})

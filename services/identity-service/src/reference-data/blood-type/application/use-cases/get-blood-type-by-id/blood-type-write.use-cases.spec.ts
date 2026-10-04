import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IBloodTypeRepository } from '../../../domain/repositories/blood-type.repository.js'
import { CreateBloodTypeUseCase } from '../create-blood-type/create-blood-type.use-case.js'
import { UpdateBloodTypeUseCase } from '../update-blood-type/update-blood-type.use-case.js'
import { DeleteBloodTypeUseCase } from '../delete-blood-type/delete-blood-type.use-case.js'
import { GetBloodTypeByIdUseCase } from './get-blood-type-by-id.use-case.js'

describe('BloodType write use cases', () => {
  const entity = { id: 'id-1', name: 'O+', isActive: true }

  const repository = {
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    countProfilesUsing: jest.fn(),
  }

  let getById: GetBloodTypeByIdUseCase
  let create: CreateBloodTypeUseCase
  let update: UpdateBloodTypeUseCase
  let remove: DeleteBloodTypeUseCase

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetBloodTypeByIdUseCase,
        CreateBloodTypeUseCase,
        UpdateBloodTypeUseCase,
        DeleteBloodTypeUseCase,
        { provide: IBloodTypeRepository, useValue: repository },
      ],
    }).compile()

    getById = moduleRef.get(GetBloodTypeByIdUseCase)
    create = moduleRef.get(CreateBloodTypeUseCase)
    update = moduleRef.get(UpdateBloodTypeUseCase)
    remove = moduleRef.get(DeleteBloodTypeUseCase)
    jest.clearAllMocks()
  })

  it('reads one by id', async () => {
    repository.findById.mockResolvedValue(entity)
    await expect(getById.execute('id-1')).resolves.toEqual(entity)
  })

  it('refuses to read one that is not there', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(getById.execute('id-1')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('creates when the name is free', async () => {
    repository.findByName.mockResolvedValue(null)
    repository.create.mockResolvedValue(entity)

    await expect(create.execute({ name: 'O+' })).resolves.toEqual(entity)
    expect(repository.create).toHaveBeenCalledWith({
      name: 'O+',
      isActive: undefined,
    })
  })

  it('refuses a duplicate name on create', async () => {
    repository.findByName.mockResolvedValue(entity)

    await expect(create.execute({ name: 'O+' })).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('lets a rename keep its own name', async () => {
    repository.findById.mockResolvedValue(entity)
    repository.findByName.mockResolvedValue(entity)
    repository.update.mockResolvedValue(entity)

    await expect(update.execute('id-1', { name: 'O+' })).resolves.toEqual(
      entity,
    )
  })

  it('refuses a rename onto another row', async () => {
    repository.findById.mockResolvedValue(entity)
    repository.findByName.mockResolvedValue({ ...entity, id: 'id-2' })

    await expect(update.execute('id-1', { name: 'O+' })).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('soft-deletes when nothing references it', async () => {
    repository.findById.mockResolvedValue(entity)
    repository.countProfilesUsing.mockResolvedValue(0)
    repository.softDelete.mockResolvedValue(entity)

    await expect(remove.execute('id-1')).resolves.toEqual({ success: true })
    expect(repository.softDelete).toHaveBeenCalledWith('id-1')
  })

  it('refuses to delete one a profile still records', async () => {
    repository.findById.mockResolvedValue(entity)
    repository.countProfilesUsing.mockResolvedValue(3)

    await expect(remove.execute('id-1')).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(repository.softDelete).not.toHaveBeenCalled()
  })
})

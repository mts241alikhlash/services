import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IReligionRepository } from '../../../domain/repositories/religion.repository.js'
import { CreateReligionUseCase } from '../create-religion/create-religion.use-case.js'
import { UpdateReligionUseCase } from '../update-religion/update-religion.use-case.js'
import { DeleteReligionUseCase } from '../delete-religion/delete-religion.use-case.js'
import { GetReligionByIdUseCase } from './get-religion-by-id.use-case.js'

describe('Religion write use cases', () => {
  const entity = { id: 'id-1', name: 'Islam', isActive: true }

  const repository = {
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    countProfilesUsing: jest.fn(),
  }

  let getById: GetReligionByIdUseCase
  let create: CreateReligionUseCase
  let update: UpdateReligionUseCase
  let remove: DeleteReligionUseCase

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetReligionByIdUseCase,
        CreateReligionUseCase,
        UpdateReligionUseCase,
        DeleteReligionUseCase,
        { provide: IReligionRepository, useValue: repository },
      ],
    }).compile()

    getById = moduleRef.get(GetReligionByIdUseCase)
    create = moduleRef.get(CreateReligionUseCase)
    update = moduleRef.get(UpdateReligionUseCase)
    remove = moduleRef.get(DeleteReligionUseCase)
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

    await expect(create.execute({ name: 'Islam' })).resolves.toEqual(entity)
    expect(repository.create).toHaveBeenCalledWith({
      name: 'Islam',
      isActive: undefined,
    })
  })

  it('refuses a duplicate name on create', async () => {
    repository.findByName.mockResolvedValue(entity)

    await expect(create.execute({ name: 'Islam' })).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('lets a rename keep its own name', async () => {
    repository.findById.mockResolvedValue(entity)
    repository.findByName.mockResolvedValue(entity)
    repository.update.mockResolvedValue(entity)

    await expect(update.execute('id-1', { name: 'Islam' })).resolves.toEqual(
      entity,
    )
  })

  it('refuses a rename onto another row', async () => {
    repository.findById.mockResolvedValue(entity)
    repository.findByName.mockResolvedValue({ ...entity, id: 'id-2' })

    await expect(
      update.execute('id-1', { name: 'Islam' }),
    ).rejects.toBeInstanceOf(ConflictException)
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

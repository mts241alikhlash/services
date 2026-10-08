import { ConflictException, NotFoundException } from '@nestjs/common'
import { IEmploymentTypeRepository } from '../../domain/repositories/employment-type.repository.js'
import { CreateEmploymentTypeUseCase } from './create-employment-type/create-employment-type.use-case.js'
import { UpdateEmploymentTypeUseCase } from './update-employment-type/update-employment-type.use-case.js'
import { DeleteEmploymentTypeUseCase } from './delete-employment-type/delete-employment-type.use-case.js'

describe('employment type writes', () => {
  const repository = {
    findByCode: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    countEmployeesWithEmploymentType: jest.fn(),
  }
  const port = repository as unknown as IEmploymentTypeRepository
  const create = new CreateEmploymentTypeUseCase(port)
  const update = new UpdateEmploymentTypeUseCase(port)
  const remove = new DeleteEmploymentTypeUseCase(port)

  beforeEach(() => {
    jest.resetAllMocks()
    repository.findByCode.mockResolvedValue(null)
    repository.findById.mockResolvedValue({ id: 'et-1' })
    repository.create.mockResolvedValue({ id: 'et-1', code: 'PNS' })
    repository.countEmployeesWithEmploymentType.mockResolvedValue(0)
  })

  it('rejects duplicate codes before writing', async () => {
    repository.findByCode.mockResolvedValue({ id: 'et-1' })
    await expect(create.execute({ code: 'PNS', name: 'PNS' })).rejects.toThrow(
      ConflictException,
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('creates with the requested code and name', async () => {
    await create.execute({ code: 'PNS', name: 'Pegawai Negeri' })
    expect(repository.create).toHaveBeenCalledWith({
      code: 'PNS',
      name: 'Pegawai Negeri',
    })
  })

  it('rejects updating a missing employment type', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(update.execute('et-1', { name: 'Baru' })).rejects.toThrow(
      NotFoundException,
    )
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('changes the name without changing the immutable code', async () => {
    await update.execute('et-1', { name: 'Baru' })
    expect(repository.update).toHaveBeenCalledWith('et-1', { name: 'Baru' })
  })

  it('refuses to delete a type used by employees', async () => {
    repository.countEmployeesWithEmploymentType.mockResolvedValue(1)
    await expect(remove.execute('et-1')).rejects.toThrow(ConflictException)
    expect(repository.remove).not.toHaveBeenCalled()
  })

  it('removes an unused type', async () => {
    await remove.execute('et-1')
    expect(repository.remove).toHaveBeenCalledWith('et-1')
  })
})

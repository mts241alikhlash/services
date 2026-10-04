import { NotFoundException } from '@nestjs/common'
import { IFundingSourceRepository } from '../../domain/repositories/funding-source.repository.js'
import { CreateFundingSourceUseCase } from './create-funding-source/create-funding-source.use-case.js'
import { DeleteFundingSourceUseCase } from './delete-funding-source/delete-funding-source.use-case.js'
import { GetFundingSourcesUseCase } from './get-funding-sources/get-funding-sources.use-case.js'
import { UpdateFundingSourceUseCase } from './update-funding-source/update-funding-source.use-case.js'

describe('funding-source use cases', () => {
  const fundingSource = {
    id: 'funding-source-1',
    code: 'FUND-GOV',
    name: 'APBD',
    description: null,
  }

  function makeRepository() {
    return {
      findMany: jest.fn().mockResolvedValue([fundingSource]),
      findById: jest.fn().mockResolvedValue(fundingSource),
      create: jest.fn().mockResolvedValue(fundingSource),
      update: jest.fn().mockResolvedValue(fundingSource),
      delete: jest.fn().mockResolvedValue(fundingSource),
    } as unknown as jest.Mocked<IFundingSourceRepository>
  }

  it('maps create input and returns created funding source', async () => {
    const repository = makeRepository()
    const useCase = new CreateFundingSourceUseCase(repository)
    const input = {
      code: 'FUND-GOV',
      name: 'APBD',
      description: undefined,
      ignored: 'field',
    }

    await expect(useCase.execute(input)).resolves.toBe(fundingSource)
    expect(repository.create).toHaveBeenCalledWith({
      code: input.code,
      name: input.name,
      description: null,
    })
  })

  it('forwards search and returns funding sources', async () => {
    const repository = makeRepository()
    const useCase = new GetFundingSourcesUseCase(repository)

    await expect(useCase.execute('ap')).resolves.toEqual([fundingSource])
    expect(repository.findMany).toHaveBeenCalledWith('ap')
  })

  it('rejects update when funding source does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new UpdateFundingSourceUseCase(repository)

    await expect(useCase.execute('missing', { name: 'BOS' })).rejects.toEqual(
      new NotFoundException('Funding Source with ID missing not found'),
    )
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('maps update input and returns updated funding source', async () => {
    const repository = makeRepository()
    const useCase = new UpdateFundingSourceUseCase(repository)
    const input = {
      code: 'FUND-SCHOOL',
      name: 'BOS',
      description: undefined,
      ignored: 'field',
    }

    await expect(useCase.execute(fundingSource.id, input)).resolves.toBe(
      fundingSource,
    )
    expect(repository.update).toHaveBeenCalledWith(fundingSource.id, {
      code: input.code,
      name: input.name,
      description: null,
    })
  })

  it('rejects delete when funding source does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new DeleteFundingSourceUseCase(repository)

    await expect(useCase.execute('missing')).rejects.toEqual(
      new NotFoundException('Funding Source with ID missing not found'),
    )
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('deletes existing funding source and returns repository result', async () => {
    const repository = makeRepository()
    const useCase = new DeleteFundingSourceUseCase(repository)

    await expect(useCase.execute(fundingSource.id)).resolves.toBe(fundingSource)
    expect(repository.delete).toHaveBeenCalledWith(fundingSource.id)
  })
})

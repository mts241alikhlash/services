import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { StorageService } from '../../../core/storage/storage.service.js'
import { IFileRepository } from '../domain/interfaces/file-repository.interface.js'
import { IFileUsageChecker } from '../domain/interfaces/file-usage-checker.interface.js'
import { DeleteFileUseCase } from './delete-file.use-case.js'

const FILE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const file = { id: FILE_ID, storageKey: 'portal/files/foto.webp' }

const repository = { findById: jest.fn(), softDelete: jest.fn() }
const storage = { deleteFile: jest.fn() }
const usageChecker = { findReferences: jest.fn() }

async function build(withChecker: boolean): Promise<DeleteFileUseCase> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      DeleteFileUseCase,
      { provide: IFileRepository, useValue: repository },
      { provide: StorageService, useValue: storage },
      ...(withChecker
        ? [{ provide: IFileUsageChecker, useValue: usageChecker }]
        : []),
    ],
  }).compile()
  return module.get(DeleteFileUseCase)
}

beforeEach(() => {
  jest.clearAllMocks()
  repository.findById.mockResolvedValue(file)
  repository.softDelete.mockResolvedValue(file)
  storage.deleteFile.mockResolvedValue(undefined)
  usageChecker.findReferences.mockResolvedValue([])
})

describe('DeleteFileUseCase', () => {
  it('deletes a file nothing references', async () => {
    const useCase = await build(true)

    await useCase.execute(FILE_ID)

    expect(repository.softDelete).toHaveBeenCalledWith(FILE_ID)
    expect(storage.deleteFile).toHaveBeenCalledWith(file.storageKey)
  })

  it('404s on an unknown id', async () => {
    const useCase = await build(true)
    repository.findById.mockResolvedValue(null)

    await expect(useCase.execute(FILE_ID)).rejects.toThrow(NotFoundException)
  })

  it('refuses while portal content references it, naming what', async () => {
    const useCase = await build(true)
    usageChecker.findReferences.mockResolvedValue([
      { label: 'Konten "Juara 1 Olimpiade"', isPublic: true },
    ])

    await expect(useCase.execute(FILE_ID)).rejects.toThrow(ConflictException)
    expect(repository.softDelete).not.toHaveBeenCalled()
    expect(storage.deleteFile).not.toHaveBeenCalled()
  })

  it('refuses even when only a draft references it', async () => {
    const useCase = await build(true)
    usageChecker.findReferences.mockResolvedValue([
      { label: 'Konten "Belum terbit"', isPublic: false },
    ])

    await expect(useCase.execute(FILE_ID)).rejects.toThrow(ConflictException)
  })

  it('names the referencing items in the refusal', async () => {
    const useCase = await build(true)
    usageChecker.findReferences.mockResolvedValue([
      { label: 'Konten "Juara 1 Olimpiade"', isPublic: true },
    ])

    await expect(useCase.execute(FILE_ID)).rejects.toMatchObject({
      response: {
        references: [{ label: 'Konten "Juara 1 Olimpiade"', isPublic: true }],
      },
    })
  })

  it('deletes normally when no usage checker is registered', async () => {
    const useCase = await build(false)

    await useCase.execute(FILE_ID)

    expect(repository.softDelete).toHaveBeenCalledWith(FILE_ID)
  })

  it('still succeeds when the stored object cannot be removed', async () => {
    const useCase = await build(true)
    storage.deleteFile.mockRejectedValue(new Error('bucket unreachable'))

    await expect(useCase.execute(FILE_ID)).resolves.toBeUndefined()
    expect(repository.softDelete).toHaveBeenCalled()
  })
})

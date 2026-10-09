import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Readable } from 'node:stream'
import { GetDownloadsUseCase } from './get-downloads/get-downloads.use-case.js'
import { SaveDownloadUseCase } from './save-download/save-download.use-case.js'
import { ReorderDownloadsUseCase } from './reorder-downloads/reorder-downloads.use-case.js'
import { DeleteDownloadUseCase } from './delete-download/delete-download.use-case.js'
import { GetDownloadFileUseCase } from './get-download-file/get-download-file.use-case.js'

const download = {
  id: 'd1',
  title: 'Brosur PPDB',
  description: null,
  fileKey: 'admission-downloads/old.pdf',
  fileName: 'brosur.pdf',
  sizeBytes: 20,
  sortOrder: 1,
  isActive: true,
  createdAt: new Date('2026-10-09T00:00:00Z'),
  updatedAt: new Date('2026-10-09T00:00:00Z'),
}

const upload = {
  buffer: Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(11)]),
  originalname: 'baru.pdf',
}

function repository(found: typeof download | null = download) {
  return {
    findAll: jest.fn().mockResolvedValue([download]),
    findActive: jest.fn().mockResolvedValue([download]),
    findById: jest.fn().mockResolvedValue(found),
    titleTaken: jest.fn().mockResolvedValue(false),
    maxSortOrder: jest.fn().mockResolvedValue(4),
    create: jest.fn().mockResolvedValue(download),
    update: jest.fn().mockResolvedValue(download),
    reorder: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  }
}

function storage() {
  return {
    put: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue({ stream: Readable.from(['x']) }),
    remove: jest.fn().mockResolvedValue(undefined),
  }
}

describe('GetDownloadsUseCase', () => {
  it('lists every file for staff and only active files for visitors', async () => {
    const repo = repository()
    const useCase = new GetDownloadsUseCase(repo)

    await expect(useCase.all()).resolves.toEqual([download])
    await expect(useCase.active()).resolves.toEqual([download])
    expect(repo.findAll).toHaveBeenCalledTimes(1)
    expect(repo.findActive).toHaveBeenCalledTimes(1)
  })
})

describe('SaveDownloadUseCase.create', () => {
  it('stores the bytes, then the row last in the list', async () => {
    const repo = repository()
    const store = storage()
    const useCase = new SaveDownloadUseCase(repo, store)

    await useCase.create({
      title: '  Brosur PPDB  ',
      description: '  Edisi 2026  ',
      file: upload,
    })

    const [key, content] = store.put.mock.calls[0] as [string, Buffer]
    expect(key).toMatch(/^admission-downloads\/[0-9a-f-]{36}\.pdf$/)
    expect(content).toBe(upload.buffer)
    expect(repo.create).toHaveBeenCalledWith({
      title: 'Brosur PPDB',
      description: 'Edisi 2026',
      fileKey: key,
      fileName: 'baru.pdf',
      sizeBytes: upload.buffer.length,
      sortOrder: 5,
      isActive: true,
    })
  })

  it('stores a blank description as null and honours isActive false', async () => {
    const repo = repository()
    await new SaveDownloadUseCase(repo, storage()).create({
      title: 'Formulir',
      description: '   ',
      isActive: false,
      file: upload,
    })

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, isActive: false }),
    )
  })

  it('refuses a blank title before touching storage', async () => {
    const store = storage()
    await expect(
      new SaveDownloadUseCase(repository() as never, store as never).create({
        title: '   ',
        file: upload,
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(store.put).not.toHaveBeenCalled()
  })

  it('refuses a duplicate title with 409 before touching storage', async () => {
    const repo = repository()
    repo.titleTaken.mockResolvedValue(true)
    const store = storage()
    await expect(
      new SaveDownloadUseCase(repo as never, store as never).create({
        title: 'brosur ppdb',
        file: upload,
      }),
    ).rejects.toEqual(new ConflictException('Judul berkas sudah ada'))
    expect(repo.titleTaken).toHaveBeenCalledWith('brosur ppdb', undefined)
    expect(store.put).not.toHaveBeenCalled()
  })

  it('refuses a file that is not a PDF and stores nothing', async () => {
    const repo = repository()
    const store = storage()
    await expect(
      new SaveDownloadUseCase(repo as never, store as never).create({
        title: 'Formulir',
        file: { buffer: Buffer.from('not a pdf'), originalname: 'x.pdf' },
      }),
    ).rejects.toEqual(
      new BadRequestException('Berkas harus PDF dan maksimal 5 MB'),
    )
    expect(store.put).not.toHaveBeenCalled()
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('refuses a missing file', async () => {
    await expect(
      new SaveDownloadUseCase(repository() as never, storage() as never).create(
        { title: 'Formulir', file: undefined },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('removes the new object when the row cannot be written', async () => {
    const repo = repository()
    repo.create.mockRejectedValue(new Error('db down'))
    const store = storage()
    await expect(
      new SaveDownloadUseCase(repo as never, store as never).create({
        title: 'Formulir',
        file: upload,
      }),
    ).rejects.toThrow('db down')
    expect(store.remove).toHaveBeenCalledWith(store.put.mock.calls[0][0])
  })
})

describe('SaveDownloadUseCase.update', () => {
  it('404s for a missing file', async () => {
    await expect(
      new SaveDownloadUseCase(
        repository(null) as never,
        storage() as never,
      ).update('d1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('renames and toggles without touching storage', async () => {
    const repo = repository()
    const store = storage()
    await new SaveDownloadUseCase(repo, store).update('d1', {
      title: ' Formulir ',
      description: '',
      isActive: false,
    })

    expect(repo.titleTaken).toHaveBeenCalledWith('Formulir', 'd1')
    expect(repo.update).toHaveBeenCalledWith('d1', {
      title: 'Formulir',
      description: null,
      isActive: false,
    })
    expect(store.put).not.toHaveBeenCalled()
    expect(store.remove).not.toHaveBeenCalled()
  })

  it('409s on a title another file owns', async () => {
    const repo = repository()
    repo.titleTaken.mockResolvedValue(true)
    await expect(
      new SaveDownloadUseCase(repo as never, storage() as never).update('d1', {
        title: 'Formulir',
      }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('uploads the new object, points the row at it, then deletes the old object', async () => {
    const repo = repository()
    const store = storage()
    const order: string[] = []
    store.put.mockImplementation(() => {
      order.push('put')
      return Promise.resolve()
    })
    repo.update.mockImplementation(() => {
      order.push('update')
      return Promise.resolve(download)
    })
    store.remove.mockImplementation(() => {
      order.push('remove')
      return Promise.resolve()
    })

    await new SaveDownloadUseCase(repo, store).update('d1', {
      file: upload,
    })

    const newKey = store.put.mock.calls[0][0] as string
    expect(newKey).not.toBe(download.fileKey)
    expect(repo.update).toHaveBeenCalledWith('d1', {
      fileKey: newKey,
      fileName: 'baru.pdf',
      sizeBytes: upload.buffer.length,
    })
    expect(store.remove).toHaveBeenCalledWith(download.fileKey)
    expect(order).toEqual(['put', 'update', 'remove'])
  })

  it('keeps the old object when the new upload fails', async () => {
    const repo = repository()
    const store = storage()
    store.put.mockRejectedValue(new Error('s3 down'))
    await expect(
      new SaveDownloadUseCase(repo as never, store as never).update('d1', {
        file: upload,
      }),
    ).rejects.toThrow('s3 down')
    expect(repo.update).not.toHaveBeenCalled()
    expect(store.remove).not.toHaveBeenCalled()
  })

  it('removes the new object and keeps the old one when the row update fails', async () => {
    const repo = repository()
    repo.update.mockRejectedValue(new Error('db down'))
    const store = storage()
    await expect(
      new SaveDownloadUseCase(repo as never, store as never).update('d1', {
        file: upload,
      }),
    ).rejects.toThrow('db down')
    expect(store.remove).toHaveBeenCalledTimes(1)
    expect(store.remove).toHaveBeenCalledWith(store.put.mock.calls[0][0])
  })

  it('does not fail when the old object cannot be deleted', async () => {
    const repo = repository()
    const store = storage()
    store.remove.mockRejectedValue(new Error('s3 down'))
    await expect(
      new SaveDownloadUseCase(repo as never, store as never).update('d1', {
        file: upload,
      }),
    ).resolves.toEqual(download)
  })

  it('refuses a non-PDF replacement before uploading', async () => {
    const store = storage()
    await expect(
      new SaveDownloadUseCase(repository() as never, store as never).update(
        'd1',
        { file: { buffer: Buffer.from('nope'), originalname: 'x.pdf' } },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(store.put).not.toHaveBeenCalled()
  })
})

describe('ReorderDownloadsUseCase', () => {
  const two = [
    { ...download, id: 'a' },
    { ...download, id: 'b' },
  ]

  it('rewrites the order and returns the list', async () => {
    const repo = repository()
    repo.findAll.mockResolvedValue(two)
    await new ReorderDownloadsUseCase(repo).execute(['b', 'a'])
    expect(repo.reorder).toHaveBeenCalledWith(['b', 'a'])
    expect(repo.findAll).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['a missing id', ['a']],
    ['a duplicated id', ['a', 'a']],
    ['a foreign id', ['a', 'z']],
    ['an extra id', ['a', 'b', 'c']],
  ])('400s on %s and changes nothing', async (_name, ids) => {
    const repo = repository()
    repo.findAll.mockResolvedValue(two)
    await expect(
      new ReorderDownloadsUseCase(repo as never).execute(ids),
    ).rejects.toEqual(new BadRequestException('Urutan berkas tidak lengkap'))
    expect(repo.reorder).not.toHaveBeenCalled()
  })
})

describe('DeleteDownloadUseCase', () => {
  it('deletes the row, then the object', async () => {
    const repo = repository()
    const store = storage()
    await new DeleteDownloadUseCase(repo, store).execute('d1')
    expect(repo.delete).toHaveBeenCalledWith('d1')
    expect(store.remove).toHaveBeenCalledWith(download.fileKey)
  })

  it('404s for a missing file and deletes nothing', async () => {
    const repo = repository(null)
    const store = storage()
    await expect(
      new DeleteDownloadUseCase(repo as never, store as never).execute('d1'),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(repo.delete).not.toHaveBeenCalled()
    expect(store.remove).not.toHaveBeenCalled()
  })

  it('still succeeds when the object cannot be removed', async () => {
    const store = storage()
    store.remove.mockRejectedValue(new Error('s3 down'))
    await expect(
      new DeleteDownloadUseCase(repository() as never, store as never).execute(
        'd1',
      ),
    ).resolves.toBeUndefined()
  })
})

describe('GetDownloadFileUseCase', () => {
  it('streams an active file', async () => {
    const store = storage()
    const result = await new GetDownloadFileUseCase(
      repository(),
      store,
    ).execute('d1')
    expect(store.read).toHaveBeenCalledWith(download.fileKey)
    expect(result.download).toBe(download)
    expect(result.stream).toBeInstanceOf(Readable)
  })

  it('404s for an inactive or missing file without reading storage', async () => {
    const store = storage()
    await expect(
      new GetDownloadFileUseCase(
        repository({ ...download, isActive: false }) as never,
        store as never,
      ).execute('d1'),
    ).rejects.toEqual(new NotFoundException('Berkas tidak ditemukan'))
    await expect(
      new GetDownloadFileUseCase(
        repository(null) as never,
        store as never,
      ).execute('d1'),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(store.read).not.toHaveBeenCalled()
  })
})

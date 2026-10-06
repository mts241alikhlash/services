import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { GetDocumentTypesUseCase } from './get-document-types/get-document-types.use-case.js'
import { SaveDocumentTypeUseCase } from './save-document-type/save-document-type.use-case.js'
import { ReorderDocumentTypesUseCase } from './reorder-document-types/reorder-document-types.use-case.js'
import { DeleteDocumentTypeUseCase } from './delete-document-type/delete-document-type.use-case.js'

const type = {
  id: 't1',
  code: 'FAMILY_CARD',
  name: 'Kartu Keluarga',
  isRequired: true,
  isActive: true,
  sortOrder: 1,
  documentCount: 0,
}

function repository(found: typeof type | null = type) {
  return {
    findAll: jest.fn().mockResolvedValue([type]),
    findById: jest.fn().mockResolvedValue(found),
    nameTaken: jest.fn().mockResolvedValue(false),
    findAllCodes: jest.fn().mockResolvedValue(['FAMILY_CARD', 'PHOTO']),
    maxSortOrder: jest.fn().mockResolvedValue(7),
    create: jest.fn().mockResolvedValue(type),
    update: jest.fn().mockResolvedValue(type),
    reorder: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  }
}

describe('GetDocumentTypesUseCase', () => {
  it('lists every type', async () => {
    const repo = repository()
    await expect(
      new GetDocumentTypesUseCase(repo as never).execute(),
    ).resolves.toEqual([type])
  })
})

describe('SaveDocumentTypeUseCase', () => {
  it('creates a trimmed type last with a generated code', async () => {
    const repo = repository()
    await new SaveDocumentTypeUseCase(repo as never).create({
      name: '  Photo ',
      isRequired: false,
      isActive: true,
    })
    expect(repo.nameTaken).toHaveBeenCalledWith('Photo', undefined)
    expect(repo.create).toHaveBeenCalledWith({
      name: 'Photo',
      isRequired: false,
      isActive: true,
      code: 'PHOTO_2',
      sortOrder: 8,
    })
  })

  it.each(['', '   '])('refuses the blank name %j on create', async (name) => {
    const repo = repository()
    await expect(
      new SaveDocumentTypeUseCase(repo as never).create({
        name,
        isRequired: true,
        isActive: true,
      }),
    ).rejects.toThrow(new BadRequestException('Nama jenis berkas wajib diisi'))
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('refuses a blank name on rename', async () => {
    const repo = repository()
    await expect(
      new SaveDocumentTypeUseCase(repo as never).update('t1', { name: '   ' }),
    ).rejects.toThrow(BadRequestException)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('refuses a duplicate name on create', async () => {
    const repo = repository()
    repo.nameTaken.mockResolvedValue(true)
    await expect(
      new SaveDocumentTypeUseCase(repo as never).create({
        name: 'kartu keluarga',
        isRequired: true,
        isActive: true,
      }),
    ).rejects.toThrow(new ConflictException('Nama jenis berkas sudah ada'))
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('renames without touching the code and allows its own name', async () => {
    const repo = repository()
    await new SaveDocumentTypeUseCase(repo as never).update('t1', {
      name: ' Kartu Keluarga ',
      isRequired: false,
    })
    expect(repo.nameTaken).toHaveBeenCalledWith('Kartu Keluarga', 't1')
    expect(repo.update).toHaveBeenCalledWith('t1', {
      name: 'Kartu Keluarga',
      isRequired: false,
    })
  })

  it('refuses a rename onto another type', async () => {
    const repo = repository()
    repo.nameTaken.mockResolvedValue(true)
    await expect(
      new SaveDocumentTypeUseCase(repo as never).update('t1', {
        name: 'Photo',
      }),
    ).rejects.toThrow(ConflictException)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown type', async () => {
    const repo = repository(null)
    await expect(
      new SaveDocumentTypeUseCase(repo as never).update('x', {
        isActive: false,
      }),
    ).rejects.toThrow(new NotFoundException('Jenis berkas tidak ditemukan'))
  })
})

describe('ReorderDocumentTypesUseCase', () => {
  const t2 = { ...type, id: 't2' }

  it('rewrites the order and returns the list', async () => {
    const repo = repository()
    repo.findAll.mockResolvedValue([type, t2])
    const result = await new ReorderDocumentTypesUseCase(repo as never).execute(
      ['t2', 't1'],
    )
    expect(repo.reorder).toHaveBeenCalledWith(['t2', 't1'])
    expect(result).toEqual([type, t2])
  })

  it.each([[['t1']], [['t1', 't2', 't3']], [['t1', 't1']], [['t1', 'x']]])(
    'refuses %j as an incomplete order',
    async (ids) => {
      const repo = repository()
      repo.findAll.mockResolvedValue([type, t2])
      await expect(
        new ReorderDocumentTypesUseCase(repo as never).execute(ids),
      ).rejects.toThrow(
        new BadRequestException('Urutan jenis berkas tidak lengkap'),
      )
      expect(repo.reorder).not.toHaveBeenCalled()
    },
  )
})

describe('DeleteDocumentTypeUseCase', () => {
  it('deletes an unused type', async () => {
    const repo = repository()
    await new DeleteDocumentTypeUseCase(repo as never).execute('t1')
    expect(repo.delete).toHaveBeenCalledWith('t1')
  })

  it('refuses a type with uploads', async () => {
    const repo = repository({ ...type, documentCount: 1 })
    await expect(
      new DeleteDocumentTypeUseCase(repo as never).execute('t1'),
    ).rejects.toThrow(
      new ConflictException('Jenis berkas sudah dipakai, nonaktifkan saja'),
    )
    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown type', async () => {
    const repo = repository(null)
    await expect(
      new DeleteDocumentTypeUseCase(repo as never).execute('x'),
    ).rejects.toThrow(NotFoundException)
  })
})

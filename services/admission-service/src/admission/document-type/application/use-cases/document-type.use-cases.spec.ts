import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import type { AdmissionDocumentTypeEntity } from '../../domain/entities/admission-document-type.entity.js'
import { GetDocumentTypesUseCase } from './get-document-types/get-document-types.use-case.js'
import { SaveDocumentTypeUseCase } from './save-document-type/save-document-type.use-case.js'
import { ReorderDocumentTypesUseCase } from './reorder-document-types/reorder-document-types.use-case.js'
import { DeleteDocumentTypeUseCase } from './delete-document-type/delete-document-type.use-case.js'

const type: AdmissionDocumentTypeEntity = {
  id: 't1',
  code: 'FAMILY_CARD',
  name: 'Kartu Keluarga',
  isRequired: true,
  requirement: 'REQUIRED',
  lateDueMonths: null,
  isActive: true,
  sortOrder: 1,
  documentCount: 0,
}

function repository(found: AdmissionDocumentTypeEntity | null = type) {
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
    await new SaveDocumentTypeUseCase(repo).create({
      name: '  Photo ',
      isRequired: false,
      isActive: true,
    })
    expect(repo.nameTaken).toHaveBeenCalledWith('Photo', undefined)
    expect(repo.create).toHaveBeenCalledWith({
      name: 'Photo',
      requirement: 'OPTIONAL',
      lateDueMonths: null,
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
    await new SaveDocumentTypeUseCase(repo).update('t1', {
      name: ' Kartu Keluarga ',
      isRequired: false,
    })
    expect(repo.nameTaken).toHaveBeenCalledWith('Kartu Keluarga', 't1')
    expect(repo.update).toHaveBeenCalledWith('t1', {
      name: 'Kartu Keluarga',
      requirement: 'OPTIONAL',
      lateDueMonths: null,
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

describe('SaveDocumentTypeUseCase requirement', () => {
  it('creates a LATER type with its limit in months', async () => {
    const repo = repository()
    await new SaveDocumentTypeUseCase(repo).create({
      name: 'Ijazah SD',
      requirement: 'LATER',
      lateDueMonths: 2,
      isActive: true,
    })
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ requirement: 'LATER', lateDueMonths: 2 }),
    )
  })

  it.each([undefined, null, 0, 13])(
    'refuses LATER with the limit %j',
    async (lateDueMonths) => {
      const repo = repository()
      await expect(
        new SaveDocumentTypeUseCase(repo).create({
          name: 'Ijazah SD',
          requirement: 'LATER',
          lateDueMonths,
          isActive: true,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Batas berkas susulan wajib diisi 1 sampai 12 bulan',
        ),
      )
      expect(repo.create).not.toHaveBeenCalled()
    },
  )

  it('refuses a limit on a type that is not LATER', async () => {
    const repo = repository()
    await expect(
      new SaveDocumentTypeUseCase(repo).create({
        name: 'Akta',
        requirement: 'REQUIRED',
        lateDueMonths: 2,
        isActive: true,
      }),
    ).rejects.toThrow(
      new BadRequestException('Batas hanya berlaku untuk berkas susulan'),
    )
  })

  it.each([
    [true, 'REQUIRED'],
    [false, 'OPTIONAL'],
  ])('maps the old isRequired %j to %s', async (isRequired, requirement) => {
    const repo = repository()
    await new SaveDocumentTypeUseCase(repo).create({
      name: 'Photo',
      isRequired,
      isActive: true,
    })
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ requirement, lateDueMonths: null }),
    )
  })

  it('refuses a create that names neither requirement nor isRequired', async () => {
    const repo = repository()
    await expect(
      new SaveDocumentTypeUseCase(repo).create({
        name: 'Photo',
        isActive: true,
      }),
    ).rejects.toThrow(new BadRequestException('Sifat berkas wajib dipilih'))
  })

  it('clears the limit when a LATER type becomes REQUIRED', async () => {
    const repo = repository({ ...type, requirement: 'LATER', lateDueMonths: 2 })
    await new SaveDocumentTypeUseCase(repo).update('t1', {
      requirement: 'REQUIRED',
    })
    expect(repo.update).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ requirement: 'REQUIRED', lateDueMonths: null }),
    )
  })

  it('needs a limit when an existing type becomes LATER', async () => {
    const repo = repository()
    await expect(
      new SaveDocumentTypeUseCase(repo).update('t1', { requirement: 'LATER' }),
    ).rejects.toThrow(BadRequestException)
    await new SaveDocumentTypeUseCase(repo).update('t1', {
      requirement: 'LATER',
      lateDueMonths: 3,
    })
    expect(repo.update).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ requirement: 'LATER', lateDueMonths: 3 }),
    )
  })

  it('keeps the requirement and the limit when only the name changes', async () => {
    const repo = repository({ ...type, requirement: 'LATER', lateDueMonths: 2 })
    await new SaveDocumentTypeUseCase(repo).update('t1', { name: 'Ijazah' })
    expect(repo.update).toHaveBeenCalledWith('t1', { name: 'Ijazah' })
  })
})

describe('ReorderDocumentTypesUseCase', () => {
  const t2 = { ...type, id: 't2' }

  it('rewrites the order and returns the list', async () => {
    const repo = repository()
    repo.findAll.mockResolvedValue([type, t2])
    const result = await new ReorderDocumentTypesUseCase(repo).execute([
      't2',
      't1',
    ])
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
    await new DeleteDocumentTypeUseCase(repo).execute('t1')
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

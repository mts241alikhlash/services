import { ConflictException, NotFoundException } from '@nestjs/common'
import { UploadLateDocumentUseCase } from './upload-late-document.use-case.js'
import type { LateDocumentPair } from '../../../domain/late-document.entity.js'

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const file = {
  buffer: png,
  mimetype: 'image/png',
  size: 1024,
  originalname: 'ijazah.png',
}

function pair(overrides: Partial<LateDocumentPair> = {}): LateDocumentPair {
  return {
    applicationId: 'app1',
    registrationNumber: 'PSB-001',
    applicantName: 'Ahmad',
    applicationStatus: 'ENROLLED',
    waveId: 'w1',
    waveName: 'Gelombang 1',
    gradeLevel: 7,
    documentType: {
      id: 'ijazah',
      code: 'IJAZAH',
      name: 'Ijazah SD',
      lateDueMonths: 2,
    },
    document: null,
    ...overrides,
  }
}

function build(found: LateDocumentPair | null) {
  const repo = { findPair: jest.fn().mockResolvedValue(found) }
  const documents = {
    saveDocument: jest.fn().mockResolvedValue({ id: 'd1', status: 'PENDING' }),
  }
  const storage = {
    save: jest.fn().mockResolvedValue({
      filename: 'x.png',
      storageKey: 'documents/IJAZAH/x.png',
    }),
  }
  return {
    repo,
    documents,
    storage,
    useCase: new UploadLateDocumentUseCase(
      repo as never,
      documents as never,
      storage,
    ),
  }
}

const input = {
  applicationId: 'app1',
  documentTypeId: 'ijazah',
  file,
  adminId: 'staff1',
}

describe('UploadLateDocumentUseCase', () => {
  it('saves a PENDING document for a MISSING row', async () => {
    const { useCase, documents, storage } = build(pair())

    await useCase.execute(input)

    expect(storage.save).toHaveBeenCalledWith(file, ['documents', 'IJAZAH'])
    expect(documents.saveDocument).toHaveBeenCalledWith({
      applicationId: 'app1',
      documentTypeId: 'ijazah',
      file: expect.objectContaining({
        originalName: 'ijazah.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
        uploadedBy: 'staff1',
      }),
    })
  })

  it('replaces a REJECTED file', async () => {
    const { useCase, documents } = build(
      pair({
        document: {
          id: 'd1',
          fileId: 'f1',
          fileName: 'f1.pdf',
          fileMimeType: 'application/pdf',
          status: 'REJECTED',
          note: 'buram',
        },
      }),
    )

    await useCase.execute(input)

    expect(documents.saveDocument).toHaveBeenCalledTimes(1)
  })

  it('refuses to replace an APPROVED file with 409', async () => {
    const { useCase, documents } = build(
      pair({
        document: {
          id: 'd1',
          fileId: 'f1',
          fileName: 'f1.pdf',
          fileMimeType: 'application/pdf',
          status: 'APPROVED',
          note: null,
        },
      }),
    )

    await expect(useCase.execute(input)).rejects.toThrow(
      new ConflictException(
        'Berkas sudah disetujui, tolak dulu bila perlu diganti',
      ),
    )
    expect(documents.saveDocument).not.toHaveBeenCalled()
  })

  it('answers 404 when the pair is not tracked (not LATER, other year or unknown)', async () => {
    const { useCase } = build(null)

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException)
  })

  it.each(['DRAFT', 'REJECTED'])(
    'refuses a %s application with 409',
    async (applicationStatus) => {
      const { useCase, documents } = build(pair({ applicationStatus }))

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(documents.saveDocument).not.toHaveBeenCalled()
    },
  )

  it('validates the file like the applicant upload', async () => {
    const { useCase } = build(pair())

    await expect(
      useCase.execute({ ...input, file: { ...file, mimetype: 'text/plain' } }),
    ).rejects.toThrow('Berkas harus JPG, PNG, atau PDF')
  })
})

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { GetDocumentReviewQueueUseCase } from './get-document-review-queue/get-document-review-queue.use-case.js'
import { GetDocumentReviewUseCase } from './get-document-review/get-document-review.use-case.js'
import { SaveDocumentDecisionUseCase } from './save-document-decision/save-document-decision.use-case.js'
import { SendDocumentReviewUseCase } from './send-document-review/send-document-review.use-case.js'

const file = {
  id: 'f1',
  originalName: 'kk.pdf',
  mimeType: 'application/pdf',
  storageKey: 'production/admission/documents/kk.pdf',
}

const document = (
  documentTypeId: string,
  status: string,
  note: string | null = null,
) => ({
  id: `doc-${documentTypeId}`,
  documentTypeId,
  status,
  note,
  verifiedAt: null,
  file,
})

function context(overrides: Record<string, unknown> = {}) {
  return {
    applicationId: 'app1',
    registrationNumber: 'PPDB-001',
    applicantName: 'Ahmad',
    waveName: 'Gelombang 1',
    status: 'SUBMITTED',
    revisionNote: null,
    submittedAt: new Date('2026-10-01T00:00:00Z'),
    paymentStatus: 'VERIFIED',
    slots: [
      {
        documentTypeId: 'kk',
        code: 'KK',
        name: 'Kartu Keluarga',
        isRequired: true,
        document: document('kk', 'APPROVED'),
      },
      {
        documentTypeId: 'akta',
        code: 'AKTA',
        name: 'Akta Kelahiran',
        isRequired: true,
        document: document('akta', 'APPROVED'),
      },
    ],
    ...overrides,
  }
}

describe('GetDocumentReviewQueueUseCase', () => {
  it('defaults to Menunggu, summarises the required documents and pages the meta', async () => {
    const findQueue = jest.fn().mockResolvedValue({
      records: [
        {
          applicationId: 'app1',
          registrationNumber: 'PPDB-001',
          applicantName: 'Ahmad',
          waveName: 'Gelombang 1',
          status: 'SUBMITTED',
          submittedAt: new Date('2026-10-01T00:00:00Z'),
          documents: [
            { documentTypeId: 'kk', status: 'APPROVED' },
            { documentTypeId: 'surat', status: 'REJECTED' },
          ],
        },
      ],
      total: 41,
      counts: { waiting: 41, revision: 2, done: 9 },
      requiredTypeIds: ['kk', 'akta'],
    })

    const result = await new GetDocumentReviewQueueUseCase({
      findQueue,
    } as never).execute({})

    expect(findQueue).toHaveBeenCalledWith({
      tab: 'waiting',
      search: undefined,
      waveId: undefined,
      page: 1,
      limit: 20,
    })
    expect(result.data[0].summary).toEqual({
      approved: 1,
      rejected: 0,
      pending: 0,
      missing: 1,
      total: 2,
    })
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 41,
      totalPages: 3,
      counts: { waiting: 41, revision: 2, done: 9 },
    })
  })
})

describe('GetDocumentReviewUseCase', () => {
  it('returns the review page of a submitted application as editable', async () => {
    const repository = { findContext: jest.fn().mockResolvedValue(context()) }

    const result = await new GetDocumentReviewUseCase(
      repository as never,
    ).execute('app1')

    expect(result).toMatchObject({ applicationId: 'app1', readOnly: false })
  })

  it.each(['REVISION_NEEDED', 'VERIFIED', 'ACCEPTED', 'REJECTED', 'ENROLLED'])(
    'is read-only once the application is %s',
    async (status) => {
      const repository = {
        findContext: jest.fn().mockResolvedValue(context({ status })),
      }

      const result = await new GetDocumentReviewUseCase(
        repository as never,
      ).execute('app1')

      expect(result.readOnly).toBe(true)
    },
  )

  it.each([
    ['unknown', null],
    ['a draft', context({ status: 'DRAFT' })],
  ])('answers 404 for %s', async (_name, found) => {
    const repository = { findContext: jest.fn().mockResolvedValue(found) }

    await expect(
      new GetDocumentReviewUseCase(repository as never).execute('app1'),
    ).rejects.toThrow(new NotFoundException('Pendaftar tidak ditemukan'))
  })
})

describe('SaveDocumentDecisionUseCase', () => {
  const base = {
    applicationId: 'app1',
    documentId: 'doc-kk',
    adminId: 'admin1',
  }

  it('requires a reason to reject', async () => {
    const repository = { saveDecision: jest.fn() }
    const useCase = new SaveDocumentDecisionUseCase(repository as never)

    await expect(
      useCase.execute({ ...base, status: 'REJECTED', note: '  ' }),
    ).rejects.toThrow(
      new BadRequestException('Alasan penolakan berkas wajib diisi'),
    )
    expect(repository.saveDecision).not.toHaveBeenCalled()
  })

  it('saves a rejection with its trimmed reason', async () => {
    const saved = document('kk', 'REJECTED', 'Buram')
    const repository = {
      saveDecision: jest
        .fn()
        .mockResolvedValue({ outcome: 'SAVED', document: saved }),
    }

    const result = await new SaveDocumentDecisionUseCase(
      repository as never,
    ).execute({ ...base, status: 'REJECTED', note: ' Buram ' })

    expect(repository.saveDecision).toHaveBeenCalledWith({
      ...base,
      status: 'REJECTED',
      note: 'Buram',
    })
    expect(result).toBe(saved)
  })

  it('clears the old reason when a document is approved after a rejection', async () => {
    const repository = {
      saveDecision: jest.fn().mockResolvedValue({
        outcome: 'SAVED',
        document: document('kk', 'APPROVED'),
      }),
    }

    await new SaveDocumentDecisionUseCase(repository as never).execute({
      ...base,
      status: 'APPROVED',
      note: 'sisa catatan lama',
    })

    expect(repository.saveDecision).toHaveBeenCalledWith({
      ...base,
      status: 'APPROVED',
      note: null,
    })
  })

  it('answers 404 for an unknown document and 409 once the application left review', async () => {
    const notFound = new SaveDocumentDecisionUseCase({
      saveDecision: jest.fn().mockResolvedValue({ outcome: 'NOT_FOUND' }),
    } as never)
    const closed = new SaveDocumentDecisionUseCase({
      saveDecision: jest.fn().mockResolvedValue({ outcome: 'NOT_SUBMITTED' }),
    } as never)

    await expect(
      notFound.execute({ ...base, status: 'APPROVED' }),
    ).rejects.toThrow(new NotFoundException('Berkas tidak ditemukan'))
    await expect(
      closed.execute({ ...base, status: 'APPROVED' }),
    ).rejects.toThrow(
      new ConflictException(
        'Keputusan berkas hanya bisa diubah selama pendaftaran menunggu pemeriksaan',
      ),
    )
  })
})

describe('SendDocumentReviewUseCase', () => {
  function setup(found: unknown, overrides: Record<string, jest.Mock> = {}) {
    const repository = {
      findContext: jest.fn().mockResolvedValue(found),
      markRevisionNeeded: jest.fn().mockResolvedValue(true),
      recordApproval: jest.fn().mockResolvedValue(true),
      ...overrides,
    }
    const notifications = { notify: jest.fn().mockResolvedValue(undefined) }
    const verifyWhenReady = { execute: jest.fn().mockResolvedValue(true) }
    const useCase = new SendDocumentReviewUseCase(
      repository as never,
      notifications as never,
      verifyWhenReady as never,
    )
    return { useCase, repository, notifications, verifyWhenReady }
  }

  const send = { applicationId: 'app1', adminId: 'admin1' }

  it('sends one approval and verifies when everything is approved and paid', async () => {
    const { useCase, notifications, verifyWhenReady, repository } =
      setup(context())

    const result = await useCase.execute(send)

    expect(result).toEqual({
      status: 'VERIFIED',
      outcome: 'APPROVED',
      verified: true,
    })
    expect(repository.markRevisionNeeded).not.toHaveBeenCalled()
    expect(repository.recordApproval).toHaveBeenCalledWith('app1')
    expect(notifications.notify).not.toHaveBeenCalled()
    expect(verifyWhenReady.execute).toHaveBeenCalledWith('app1', 'admin1')
  })

  it('answers 409 and verifies nothing when the approval was already sent or the documents changed', async () => {
    const { useCase, verifyWhenReady } = setup(context(), {
      recordApproval: jest.fn().mockResolvedValue(false),
    })

    await expect(useCase.execute(send)).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(verifyWhenReady.execute).not.toHaveBeenCalled()
  })

  it('stays submitted when the payment is not verified yet', async () => {
    const { useCase, verifyWhenReady } = setup(
      context({ paymentStatus: 'PENDING' }),
    )
    verifyWhenReady.execute.mockResolvedValue(false)

    await expect(useCase.execute(send)).resolves.toEqual({
      status: 'SUBMITTED',
      outcome: 'APPROVED',
      verified: false,
    })
  })

  it('returns the form for revision with one notification listing the rejected documents', async () => {
    const found = context({
      slots: [
        {
          documentTypeId: 'kk',
          code: 'KK',
          name: 'Kartu Keluarga',
          isRequired: true,
          document: document('kk', 'REJECTED', 'Buram'),
        },
        {
          documentTypeId: 'akta',
          code: 'AKTA',
          name: 'Akta Kelahiran',
          isRequired: true,
          document: document('akta', 'APPROVED'),
        },
      ],
    })
    const { useCase, repository, notifications, verifyWhenReady } = setup(found)

    const result = await useCase.execute({
      ...send,
      dataNote: 'NIK ayah salah',
    })

    expect(result).toEqual({
      status: 'REVISION_NEEDED',
      outcome: 'REVISION_REQUESTED',
      verified: false,
    })
    const note =
      'Berkas yang perlu diunggah ulang:\n- Kartu Keluarga: Buram\n\nCatatan data: NIK ayah salah'
    expect(repository.markRevisionNeeded).toHaveBeenCalledWith('app1', note)
    expect(notifications.notify).toHaveBeenCalledTimes(1)
    expect(notifications.notify).toHaveBeenCalledWith(
      'app1',
      'STATUS_CHANGE',
      'Formulir perlu diperbaiki',
      expect.stringContaining(note),
    )
    expect(verifyWhenReady.execute).not.toHaveBeenCalled()
  })

  it('lets a data note go out while documents are still undecided', async () => {
    const found = context({
      slots: [
        {
          documentTypeId: 'kk',
          code: 'KK',
          name: 'Kartu Keluarga',
          isRequired: true,
          document: null,
        },
      ],
    })
    const { useCase, repository } = setup(found)

    await useCase.execute({ ...send, dataNote: 'Mohon unggah KK' })

    expect(repository.markRevisionNeeded).toHaveBeenCalledWith(
      'app1',
      'Catatan data: Mohon unggah KK',
    )
  })

  it('refuses to send while a required document is undecided or missing', async () => {
    const found = context({
      slots: [
        {
          documentTypeId: 'kk',
          code: 'KK',
          name: 'Kartu Keluarga',
          isRequired: true,
          document: document('kk', 'PENDING'),
        },
      ],
    })
    const { useCase, notifications } = setup(found)

    await expect(useCase.execute(send)).rejects.toThrow(
      new ConflictException(
        'Masih ada berkas wajib yang belum diputuskan atau belum diunggah',
      ),
    )
    expect(notifications.notify).not.toHaveBeenCalled()
  })

  it.each(['REVISION_NEEDED', 'VERIFIED', 'ACCEPTED', 'REJECTED'])(
    'answers 409 when the application is %s',
    async (status) => {
      const { useCase, notifications } = setup(context({ status }))

      await expect(useCase.execute(send)).rejects.toBeInstanceOf(
        ConflictException,
      )
      expect(notifications.notify).not.toHaveBeenCalled()
    },
  )

  it('answers 404 for an unknown or draft application', async () => {
    await expect(setup(null).useCase.execute(send)).rejects.toBeInstanceOf(
      NotFoundException,
    )
    await expect(
      setup(context({ status: 'DRAFT' })).useCase.execute(send),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('does not notify when another request already returned the form', async () => {
    const found = context({
      slots: [
        {
          documentTypeId: 'kk',
          code: 'KK',
          name: 'Kartu Keluarga',
          isRequired: true,
          document: document('kk', 'REJECTED', 'Buram'),
        },
      ],
    })
    const { useCase, notifications } = setup(found, {
      markRevisionNeeded: jest.fn().mockResolvedValue(false),
    })

    await expect(useCase.execute(send)).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(notifications.notify).not.toHaveBeenCalled()
  })
})

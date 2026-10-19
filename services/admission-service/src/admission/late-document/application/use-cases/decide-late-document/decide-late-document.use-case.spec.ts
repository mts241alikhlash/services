import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { DecideLateDocumentUseCase } from './decide-late-document.use-case.js'

function build(document: unknown) {
  const documents = {
    findDocument: jest.fn().mockResolvedValue(document),
    updateDocumentStatus: jest
      .fn()
      .mockResolvedValue({ id: 'd1', status: 'APPROVED' }),
  }
  const notifications = { notify: jest.fn() }
  return {
    documents,
    notifications,
    useCase: new DecideLateDocumentUseCase(documents as never),
  }
}

const late = {
  id: 'd1',
  documentType: { requirement: 'LATER', name: 'Ijazah SD' },
}
const base = { applicationId: 'app1', documentId: 'd1', adminId: 'staff1' }

describe('DecideLateDocumentUseCase', () => {
  it('approves and rejects without touching the application status', async () => {
    const { useCase, documents } = build(late)

    await useCase.execute({ ...base, status: 'APPROVED' })
    await useCase.execute({ ...base, status: 'REJECTED', note: ' Foto buram ' })

    expect(documents.updateDocumentStatus).toHaveBeenNthCalledWith(1, 'd1', {
      status: 'APPROVED',
      note: null,
      adminId: 'staff1',
    })
    expect(documents.updateDocumentStatus).toHaveBeenNthCalledWith(2, 'd1', {
      status: 'REJECTED',
      note: 'Foto buram',
      adminId: 'staff1',
    })
  })

  it('needs a reason to reject', async () => {
    const { useCase, documents } = build(late)

    await expect(
      useCase.execute({ ...base, status: 'REJECTED', note: '  ' }),
    ).rejects.toThrow(
      new BadRequestException('Alasan penolakan berkas wajib diisi'),
    )
    expect(documents.updateDocumentStatus).not.toHaveBeenCalled()
  })

  it('answers 404 when the document is not of that application', async () => {
    const { useCase } = build(null)

    await expect(
      useCase.execute({ ...base, status: 'APPROVED' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('answers 409 for a type that is not LATER', async () => {
    const { useCase, documents } = build({
      id: 'd1',
      documentType: { requirement: 'REQUIRED', name: 'Kartu Keluarga' },
    })

    await expect(
      useCase.execute({ ...base, status: 'APPROVED' }),
    ).rejects.toThrow(
      new ConflictException('Berkas ini diperiksa lewat Verifikasi Berkas'),
    )
    expect(documents.updateDocumentStatus).not.toHaveBeenCalled()
  })
})

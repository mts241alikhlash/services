import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import type { IAdmissionDocumentRepository } from '../../../domain/repositories/admission-document-repository.js'
import type { IAdmissionFileStorage } from '../../../domain/repositories/admission-file-storage.js'
import { UploadAttachmentUseCase } from './upload-attachment.use-case.js'

const file = (overrides: Record<string, unknown> = {}) => ({
  buffer: Buffer.from('%PDF-1.7\n'),
  originalname: 'piagam.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  ...overrides,
})

describe('UploadAttachmentUseCase', () => {
  let documents: {
    findApplicationForUpload: jest.Mock
    findByApplicationId: jest.Mock
    saveAttachment: jest.Mock
  }
  let storage: { save: jest.Mock }
  let useCase: UploadAttachmentUseCase

  beforeEach(() => {
    documents = {
      findApplicationForUpload: jest
        .fn()
        .mockResolvedValue({ id: 'app1', status: 'DRAFT' }),
      findByApplicationId: jest
        .fn()
        .mockResolvedValue({ id: 'app1', status: 'DRAFT' }),
      saveAttachment: jest.fn().mockResolvedValue({ id: 'file1' }),
    }
    storage = {
      save: jest.fn().mockResolvedValue({
        filename: 'a.pdf',
        storageKey: 'attachments/a.pdf',
      }),
    }
    useCase = new UploadAttachmentUseCase(
      documents as unknown as IAdmissionDocumentRepository,
      storage,
    )
  })

  it('refuses a GIF', async () => {
    await expect(
      useCase.execute('u1', file({ mimetype: 'image/gif' })),
    ).rejects.toThrow(BadRequestException)
    expect(storage.save).not.toHaveBeenCalled()
  })

  it('refuses a file over 5 MB', async () => {
    await expect(
      useCase.execute('u1', file({ size: 5 * 1024 * 1024 + 1 })),
    ).rejects.toThrow(BadRequestException)
  })

  it('stores the file tied to the application and returns its id', async () => {
    const result = await useCase.execute('u1', file())

    expect(storage.save).toHaveBeenCalledWith(expect.anything(), [
      'attachments',
    ])
    expect(documents.saveAttachment).toHaveBeenCalledWith({
      applicationId: 'app1',
      file: {
        filename: 'a.pdf',
        originalName: 'piagam.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageKey: 'attachments/a.pdf',
        uploadedBy: 'u1',
      },
    })
    expect(result).toEqual({ id: 'file1' })
  })

  it('stores an on-behalf upload under the application of the path', async () => {
    await useCase.executeForApplication('app1', file(), 'admin1')

    expect(documents.findByApplicationId).toHaveBeenCalledWith('app1')
    expect(documents.saveAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 'app1',
        file: expect.objectContaining({ uploadedBy: 'admin1' }),
      }),
    )
  })

  it('answers 404 when the applicant has no application', async () => {
    documents.findApplicationForUpload.mockResolvedValue(null)

    await expect(useCase.execute('u1', file())).rejects.toThrow(
      NotFoundException,
    )
  })

  it('refuses an upload once the application is locked', async () => {
    documents.findApplicationForUpload.mockResolvedValue({
      id: 'app1',
      status: 'SUBMITTED',
    })

    await expect(useCase.execute('u1', file())).rejects.toThrow(
      ConflictException,
    )
    expect(storage.save).not.toHaveBeenCalled()
  })
})

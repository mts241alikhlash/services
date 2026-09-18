import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AdmissionDocumentStatus } from '../../../../shared/domain/enums/admission-document-status.enum.js'
import { IAdmissionDocumentNotificationPort } from '../../domain/repositories/admission-document-notification.port.js'
import { IAdmissionDocumentRepository } from '../../domain/repositories/admission-document-repository.js'
import { IAdmissionFileStorage } from '../../domain/repositories/admission-file-storage.js'
import { UploadAdmissionDocumentUseCase } from './upload-admission-document/upload-admission-document.use-case.js'
import { VerifyDocumentUseCase } from './verify-document/verify-document.use-case.js'

describe('Document workflow use-cases', () => {
  const repo = {
    findDocument: jest.fn(),
    updateDocumentStatus: jest.fn(),
    findApplicationForUpload: jest.fn(),
    findByApplicationId: jest.fn(),
    findDocumentTypeByCode: jest.fn(),
    saveDocument: jest.fn(),
  }
  const storage = { save: jest.fn() }
  const notifications = { notify: jest.fn() }

  let verifyDocument: VerifyDocumentUseCase
  let uploadDocument: UploadAdmissionDocumentUseCase

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyDocumentUseCase,
        UploadAdmissionDocumentUseCase,
        { provide: IAdmissionDocumentRepository, useValue: repo },
        { provide: IAdmissionFileStorage, useValue: storage },
        {
          provide: IAdmissionDocumentNotificationPort,
          useValue: notifications,
        },
      ],
    }).compile()

    verifyDocument = module.get(VerifyDocumentUseCase)
    uploadDocument = module.get(UploadAdmissionDocumentUseCase)
    jest.clearAllMocks()
  })

  it('requires a note when rejecting a document', async () => {
    await expect(
      verifyDocument.execute({
        applicationId: 'app1',
        documentId: 'doc1',
        status: AdmissionDocumentStatus.REJECTED,
        adminId: 'admin1',
      }),
    ).rejects.toThrow(BadRequestException)
  })

  describe('UploadAdmissionDocumentUseCase.executeForApplication', () => {
    const file = {
      mimetype: 'image/png',
      size: 1024,
      originalname: 'kk.png',
    }

    it('resolves the application by id, not by user', async () => {
      repo.findByApplicationId.mockResolvedValue(null)

      await expect(
        uploadDocument.executeForApplication({
          applicationId: 'app1',
          documentTypeCode: 'KK',
          file: file as never,
          adminId: 'admin1',
        }),
      ).rejects.toThrow(NotFoundException)
      expect(repo.findApplicationForUpload).not.toHaveBeenCalled()
    })

    it('refuses an upload when the application is not editable', async () => {
      repo.findByApplicationId.mockResolvedValue({
        id: 'app1',
        status: 'SUBMITTED',
      })

      await expect(
        uploadDocument.executeForApplication({
          applicationId: 'app1',
          documentTypeCode: 'KK',
          file: file as never,
          adminId: 'admin1',
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('attributes the saved file to the acting administrator', async () => {
      repo.findByApplicationId.mockResolvedValue({
        id: 'app1',
        status: 'DRAFT',
      })
      repo.findDocumentTypeByCode.mockResolvedValue({ id: 'dt1', name: 'KK' })
      storage.save.mockResolvedValue({
        filename: 'stored.png',
        storageKey: 'documents/KK/stored.png',
      })
      repo.saveDocument.mockResolvedValue({ id: 'doc1' })

      await uploadDocument.executeForApplication({
        applicationId: 'app1',
        documentTypeCode: 'KK',
        file: file as never,
        adminId: 'admin1',
      })

      expect(repo.saveDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'app1',
          documentTypeId: 'dt1',
          file: expect.objectContaining({ uploadedBy: 'admin1' }),
        }),
      )
    })
  })
})

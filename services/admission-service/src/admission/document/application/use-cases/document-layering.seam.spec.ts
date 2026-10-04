import {
  DocumentModule,
  UploadAdmissionDocumentUseCase,
  VerifyDocumentUseCase,
} from '../../index.js'

describe('Document public API', () => {
  it('exposes document module and document operations', () => {
    expect(DocumentModule).toBeDefined()
    expect(UploadAdmissionDocumentUseCase).toBeDefined()
    expect(VerifyDocumentUseCase).toBeDefined()
  })
})

import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionDocumentReviewController } from './admission-document-review.controller.js'

function required(method: string): unknown {
  return Reflect.getMetadata(
    PERMISSIONS_KEY,
    (
      AdmissionDocumentReviewController.prototype as unknown as Record<
        string,
        object
      >
    )[method],
  )
}

describe('document review permissions', () => {
  it.each([
    ['findAll', 'admission-documents.read'],
    ['findOne', 'admission-documents.read'],
    ['decide', 'admission-documents.verify'],
    ['send', 'admission-documents.verify'],
  ])('%s requires %s', (method, permission) => {
    expect(required(method)).toEqual([permission])
  })
})

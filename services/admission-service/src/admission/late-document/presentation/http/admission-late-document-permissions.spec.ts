import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionLateDocumentController } from './admission-late-document.controller.js'

function required(method: string): unknown {
  const target = AdmissionLateDocumentController.prototype as unknown as Record<
    string,
    object
  >
  return Reflect.getMetadata(PERMISSIONS_KEY, target[method])
}

describe('late document permissions', () => {
  it.each([
    ['findAll', 'admission-late-documents.read'],
    ['upload', 'admission-late-documents.upload'],
    ['decide', 'admission-late-documents.verify'],
  ])('%s requires %s', (method, permission) => {
    expect(required(method)).toEqual([permission])
  })
})

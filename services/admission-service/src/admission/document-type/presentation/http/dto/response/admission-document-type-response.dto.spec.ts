import { AdmissionDocumentTypeResponseDto } from './admission-document-type-response.dto.js'

const entity = {
  id: 't1',
  code: 'IJAZAH',
  name: 'Ijazah SD',
  isRequired: false,
  requirement: 'LATER' as const,
  lateDueMonths: 2,
  isActive: true,
  sortOrder: 1,
  documentCount: 0,
}

describe('AdmissionDocumentTypeResponseDto', () => {
  it('carries the requirement and the limit', () => {
    const dto = AdmissionDocumentTypeResponseDto.fromDomain(entity)
    expect(dto.requirement).toBe('LATER')
    expect(dto.lateDueMonths).toBe(2)
  })

  it.each([
    ['REQUIRED', true],
    ['LATER', false],
    ['OPTIONAL', false],
  ] as const)('answers isRequired for %s as %s', (requirement, expected) => {
    const dto = AdmissionDocumentTypeResponseDto.fromDomain({
      ...entity,
      requirement,
      isRequired: expected,
    })
    expect(dto.isRequired).toBe(expected)
  })
})

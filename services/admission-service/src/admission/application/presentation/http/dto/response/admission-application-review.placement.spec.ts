import { AdmissionApplicationReviewResponseDto } from './admission-application-response.dto.js'

describe('AdmissionApplicationReviewResponseDto placement fields', () => {
  it('carries the admission type, the target grade and the NIS', () => {
    const dto = AdmissionApplicationReviewResponseDto.fromDomain({
      documentTypes: [],
      admissionType: 'TRANSFER',
      targetGradeId: 'g8',
      targetGradeLevel: 8,
      nis: '262708001',
    } as never)

    expect(dto).toMatchObject({
      admissionType: 'TRANSFER',
      targetGradeId: 'g8',
      targetGradeLevel: 8,
      nis: '262708001',
    })
  })
})

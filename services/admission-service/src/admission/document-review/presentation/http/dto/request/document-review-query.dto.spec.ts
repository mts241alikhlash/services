import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { DocumentReviewQueryDto } from './document-review-query.dto.js'

const errorsFor = (limit: string) =>
  validateSync(plainToInstance(DocumentReviewQueryDto, { limit }))

describe('DocumentReviewQueryDto', () => {
  it('accepts a page of 100 rows', () => {
    expect(errorsFor('100')).toHaveLength(0)
  })

  it('rejects more than 100 rows', () => {
    expect(errorsFor('101')).toHaveLength(1)
  })
})

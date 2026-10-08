import { summarizeDocuments } from './document-summary.policy.js'

describe('summarizeDocuments', () => {
  it('counts the required documents by decision', () => {
    expect(
      summarizeDocuments(
        ['kk', 'akta', 'foto', 'ijazah'],
        [
          { documentTypeId: 'kk', status: 'APPROVED' },
          { documentTypeId: 'akta', status: 'REJECTED' },
          { documentTypeId: 'foto', status: 'PENDING' },
        ],
      ),
    ).toEqual({ approved: 1, rejected: 1, pending: 1, missing: 1, total: 4 })
  })

  it('ignores documents of types that are not required', () => {
    expect(
      summarizeDocuments(
        ['kk'],
        [
          { documentTypeId: 'kk', status: 'APPROVED' },
          { documentTypeId: 'surat', status: 'REJECTED' },
        ],
      ),
    ).toEqual({ approved: 1, rejected: 0, pending: 0, missing: 0, total: 1 })
  })

  it('is all zero when nothing is required', () => {
    expect(summarizeDocuments([], [])).toEqual({
      approved: 0,
      rejected: 0,
      pending: 0,
      missing: 0,
      total: 0,
    })
  })
})

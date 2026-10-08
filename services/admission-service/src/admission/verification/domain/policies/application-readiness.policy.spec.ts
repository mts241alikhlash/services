import {
  isReadyForVerification,
  unapprovedRequiredTypeIds,
} from './application-readiness.policy.js'

const approved = (documentTypeId: string) => ({
  documentTypeId,
  status: 'APPROVED',
})

describe('unapprovedRequiredTypeIds', () => {
  it('lists the required types without an approved document', () => {
    expect(
      unapprovedRequiredTypeIds(
        ['kk', 'akta', 'foto'],
        [
          approved('kk'),
          { documentTypeId: 'akta', status: 'PENDING' },
          { documentTypeId: 'foto', status: 'REJECTED' },
        ],
      ),
    ).toEqual(['akta', 'foto'])
  })

  it('counts a missing document as unapproved', () => {
    expect(unapprovedRequiredTypeIds(['kk'], [])).toEqual(['kk'])
  })

  it('ignores documents of types that are not required', () => {
    expect(
      unapprovedRequiredTypeIds(
        ['kk'],
        [approved('kk'), { documentTypeId: 'surat', status: 'REJECTED' }],
      ),
    ).toEqual([])
  })

  it('has nothing to approve when no type is required', () => {
    expect(unapprovedRequiredTypeIds([], [])).toEqual([])
  })
})

describe('isReadyForVerification', () => {
  const ready = {
    status: 'SUBMITTED',
    requiredTypeIds: ['kk'],
    documents: [approved('kk')],
    paymentStatus: 'VERIFIED',
  }

  it('is ready when submitted, documents approved and payment verified', () => {
    expect(isReadyForVerification(ready)).toBe(true)
  })

  it('is ready with no required type at all', () => {
    expect(
      isReadyForVerification({ ...ready, requiredTypeIds: [], documents: [] }),
    ).toBe(true)
  })

  it.each(['DRAFT', 'REVISION_NEEDED', 'VERIFIED', 'ACCEPTED', 'REJECTED'])(
    'is never ready from %s',
    (status) => {
      expect(isReadyForVerification({ ...ready, status })).toBe(false)
    },
  )

  it.each([null, 'UNPAID', 'PENDING', 'REJECTED'])(
    'is not ready while the payment is %s',
    (paymentStatus) => {
      expect(isReadyForVerification({ ...ready, paymentStatus })).toBe(false)
    },
  )

  it('is not ready while a required document is not approved', () => {
    expect(
      isReadyForVerification({
        ...ready,
        documents: [{ documentTypeId: 'kk', status: 'PENDING' }],
      }),
    ).toBe(false)
  })
})

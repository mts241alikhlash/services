import { SYSTEM_PERMISSIONS } from './permission-codes.constants.js'

const NEW_LISTS = [
  'income-ranges',
  'financing-sources',
  'disability-types',
  'special-needs',
  'student-residences',
  'parent-residences',
  'transportations',
  'travel-distances',
  'travel-times',
  'parent-life-statuses',
  'domiciles',
  'scholarship-categories',
  'scholarship-provider-types',
  'competition-fields',
  'competition-levels',
]

describe('reference list permissions', () => {
  it.each(NEW_LISTS)(
    'declares read, create, update and delete for %s',
    (list) => {
      const codes = SYSTEM_PERMISSIONS.filter((p) => p.module === list).map(
        (p) => p.code,
      )
      expect(codes.sort()).toEqual(
        ['create', 'delete', 'read', 'update'].map((a) => `${list}.${a}`),
      )
    },
  )

  it('declares every code once', () => {
    const codes = SYSTEM_PERMISSIONS.map((p) => p.code)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

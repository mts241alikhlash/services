import { legacyIncomeFor } from './enroll-as-student.rules.js'

describe('legacyIncomeFor', () => {
  it('maps a fixed income range id to the enum student-service still stores', () => {
    expect(legacyIncomeFor('861993f5-7504-46e8-b888-359c65a4fc6f')).toBe(
      'BETWEEN_1M_2M',
    )
  })

  it('gives null for no id or an id outside the fixed ranges', () => {
    expect(legacyIncomeFor(null)).toBeNull()
    expect(legacyIncomeFor('7f9c2d4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f')).toBeNull()
  })
})

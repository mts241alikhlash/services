import { BadRequestException } from '@nestjs/common'
import { assertValidPoints } from './validate-points.policy.js'

describe('assertValidPoints', () => {
  it.each([0.25, 1, 2.5, 100])('accepts %s', (points) => {
    expect(() => assertValidPoints(points)).not.toThrow()
  })

  it.each([0, 0.2, -1, 100.5, 1e308, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuses %s',
    (points) => {
      expect(() => assertValidPoints(points)).toThrow(
        new BadRequestException('Poin harus antara 0,25 dan 100'),
      )
    },
  )
})

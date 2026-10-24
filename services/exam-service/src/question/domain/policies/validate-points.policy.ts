import { BadRequestException } from '@nestjs/common'

export const MIN_POINTS = 0.25
export const MAX_POINTS = 100

export function assertValidPoints(points: number): void {
  if (!Number.isFinite(points) || points < MIN_POINTS || points > MAX_POINTS) {
    throw new BadRequestException('Poin harus antara 0,25 dan 100')
  }
}

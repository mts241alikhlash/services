import { BadRequestException } from '@nestjs/common'

export function assertScoreInRange(
  score: number | null | undefined,
  maxScore: number | null | undefined,
): void {
  if (score === null || score === undefined) return

  const limit = maxScore ?? 100
  if (score < 0 || score > limit) {
    throw new BadRequestException(
      `Score ${score} is outside the range 0-${limit} allowed by this assessment item`,
    )
  }
}

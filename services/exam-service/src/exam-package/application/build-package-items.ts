import { BadRequestException } from '@nestjs/common'
import type { PackageItem } from '../domain/entities/exam-package.entity.js'
import { assertPackageItems } from '../domain/policies/assert-package-items.policy.js'
import type { IQuestionRepository } from '../../question/domain/repositories/question.repository.js'

export const MAX_TITLE_LENGTH = 200

export function normalizeTitle(title: string): string {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    throw new BadRequestException('Judul paket wajib diisi')
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new BadRequestException('Judul paket maksimal 200 karakter')
  }
  return trimmed
}

export async function buildPackageItems(
  questions: IQuestionRepository,
  target: { subjectId: string; gradeId: string },
  questionIds: string[],
  existing: PackageItem[] = [],
): Promise<PackageItem[]> {
  const pinnedVersions = new Map(
    existing.map((item) => [item.questionId, item.questionVersion]),
  )
  const fresh = questionIds.filter((id) => !pinnedVersions.has(id))
  const refs = await questions.findApprovedRefs(fresh)
  assertPackageItems(
    { ...target, questions: refs },
    questionIds,
    new Set(pinnedVersions.keys()),
  )
  const byId = new Map(refs.map((ref) => [ref.id, ref]))
  return questionIds.map((questionId, index) => ({
    questionId,
    questionVersion:
      pinnedVersions.get(questionId) ??
      byId.get(questionId)?.approvedVersion ??
      0,
    position: index + 1,
  }))
}

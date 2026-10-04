import type { UpdateMyApplicationInput } from '../../../../application/use-cases/update-my-application/update-my-application.input.js'
import type { UpdateMyApplicationDto } from './update-my-application.dto.js'

export function toUpdateInput(
  dto: UpdateMyApplicationDto,
): UpdateMyApplicationInput {
  const { birthDate, parents, ...fields } = dto
  return {
    ...fields,
    ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
    parents: parents?.map((parent) => ({
      ...parent,
      nik: parent.nik ?? null,
      birthPlace: parent.birthPlace ?? null,
      birthDate: parent.birthDate ? new Date(parent.birthDate) : null,
      phone: parent.phone ?? null,
      occupationId: parent.occupationId ?? null,
      educationId: parent.educationId ?? null,
      incomeRangeId: parent.incomeRangeId ?? null,
      lifeStatusId: parent.lifeStatusId ?? null,
      domicileId: parent.domicileId ?? null,
      residenceId: parent.residenceId ?? null,
      isPrimary: parent.isPrimary ?? false,
    })),
  }
}
